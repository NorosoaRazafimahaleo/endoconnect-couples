import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQuestions } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // ── 1. Auth check ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // ── 2. Parse body ──────────────────────────────────────────────────────
    const { session_number, language, couple_id } = await req.json();

    if (!session_number || !couple_id) {
      return new Response(
        JSON.stringify({ error: "session_number and couple_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 3. AI key check ────────────────────────────────────────────────────
    // FIX: renamed from LOVABLE_API_KEY to AI_PROVIDER_KEY
    // Update your Supabase secret name to match
    const AI_PROVIDER_KEY =
      Deno.env.get("AI_PROVIDER_KEY") ?? Deno.env.get("LOVABLE_API_KEY");

    if (!AI_PROVIDER_KEY) {
      throw new Error("AI_PROVIDER_KEY not configured in Supabase secrets");
    }

    // ── 4. Service client (bypasses RLS for server operations) ─────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 5. Verify caller belongs to the requested couple ───────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", userId)
      .single();

    if (!profile?.couple_id || profile.couple_id !== couple_id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 6. FIX: Find session OR create it if missing ───────────────────────
    // Previously the code threw if session was null.
    // Now we create it on the fly so partner B joining doesn't break the flow.
    let { data: session } = await supabase
      .from("sessions")
      .select("id, status")
      .eq("couple_id", couple_id)
      .eq("session_number", session_number)
      .maybeSingle(); // maybeSingle() returns null instead of error when not found

    if (!session) {
      // Guard: don't allow starting session 2 or 3 unless previous is completed
      if (session_number > 1) {
        const { data: prevSession } = await supabase
          .from("sessions")
          .select("status")
          .eq("couple_id", couple_id)
          .eq("session_number", session_number - 1)
          .maybeSingle();

        if (!prevSession || prevSession.status !== "completed") {
          return new Response(
            JSON.stringify({
              error: `Session ${session_number - 1} must be completed first`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      const { data: newSession, error: sessionErr } = await supabase
        .from("sessions")
        .insert({
          couple_id,
          session_number,
          status: "active",
        })
        .select("id, status")
        .single();

      if (sessionErr || !newSession) {
        throw new Error(`Failed to create session: ${sessionErr?.message}`);
      }

      session = newSession;
    }

    // ── 7. Get previous question IDs for this couple (deduplication) ───────
    const { data: existingSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("couple_id", couple_id);

    const sessionIds = (existingSessions ?? []).map((s: any) => s.id);

    let previousIds: string[] = [];
    if (sessionIds.length > 0) {
      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("id")
        .in("session_id", sessionIds);

      previousIds = (existingQuestions ?? []).map((q: any) => q.id);
    }

    // ── 8. Generate questions via AI provider ──────────────────────────────
    const questions = await generateQuestions(
      session_number,
      language || "en",
      couple_id,
      previousIds,
      AI_PROVIDER_KEY
    );

    if (!questions || questions.length === 0) {
      throw new Error("AI provider returned no questions");
    }

    // ── 9. Clean up unanswered questions from previous attempts ───────────
    const { data: existingForSession } = await supabase
      .from("questions")
      .select("id")
      .eq("session_id", session.id);

    const existingIds = (existingForSession ?? []).map((q: any) => q.id);

    if (existingIds.length > 0) {
      const { data: answeredQs } = await supabase
        .from("answers")
        .select("question_id")
        .in("question_id", existingIds);

      const answeredSet = new Set(
        (answeredQs ?? []).map((a: any) => a.question_id)
      );
      const deletableIds = existingIds.filter(
        (qid: string) => !answeredSet.has(qid)
      );

      if (deletableIds.length > 0) {
        await supabase.from("questions").delete().in("id", deletableIds);
      }
    }

    // ── 10. Insert new questions ───────────────────────────────────────────
    const toInsert = questions.map((q: any, index: number) => ({
      session_id: session.id,
      question_text: q.question_text,
      perspective: q.perspective || "both",
      category: q.category || "General",
      difficulty: q.difficulty || 1,
      order_index: q.order_index ?? index,
    }));

    const { error: insertErr } = await supabase
      .from("questions")
      .insert(toInsert);

    if (insertErr) {
      throw new Error(`Failed to insert questions: ${insertErr.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, count: toInsert.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("generate-questions error:", e);
    return new Response(
      JSON.stringify({
        error: "An internal error occurred. Please try again.",
        detail: e?.message ?? String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
