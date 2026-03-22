import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQuestions } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_number, language, couple_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get existing question IDs for this couple to avoid repeats
    const { data: existingQuestions } = await supabase
      .from("questions")
      .select("id, session_id")
      .in("session_id", (
        await supabase.from("sessions").select("id").eq("couple_id", couple_id)
      ).data?.map((s: any) => s.id) || []);

    const previousIds = existingQuestions?.map((q: any) => q.id) || [];

    // Generate questions via AI
    const questions = await generateQuestions(
      session_number,
      language || "en",
      couple_id,
      previousIds,
      LOVABLE_API_KEY
    );

    // Get the session for this couple + number
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("couple_id", couple_id)
      .eq("session_number", session_number)
      .single();

    if (!session) throw new Error("Session not found");

    // Insert questions
    const toInsert = questions.map((q: any) => ({
      session_id: session.id,
      question_text: q.question_text,
      perspective: q.perspective || "both",
      category: q.category || "General",
      difficulty: q.difficulty || 1,
      order_index: q.order_index || 0,
    }));

    await supabase.from("questions").insert(toInsert);

    return new Response(JSON.stringify({ success: true, count: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
