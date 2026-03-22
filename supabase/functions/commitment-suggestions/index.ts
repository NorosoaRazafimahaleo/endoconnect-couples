import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCommitmentSuggestions } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, user_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user_id)
      .single();

    // Get answer themes from this session
    const { data: answers } = await supabase
      .from("answers")
      .select("answer_text, questions!inner(session_id)")
      .eq("user_id", user_id)
      .eq("questions.session_id", session_id);

    const themes = answers?.map((a: any) => a.answer_text.substring(0, 100)) || [];

    const suggestions = await getCommitmentSuggestions(
      profile?.role || "partner",
      themes,
      60, // default alignment
      LOVABLE_API_KEY
    );

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("commitment-suggestions error:", e);
    return new Response(
      JSON.stringify({
        suggestions: [
          "Schedule a weekly check-in about how we're both feeling",
          "Research one new thing about endometriosis together",
          "Practice active listening without offering solutions",
        ],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
