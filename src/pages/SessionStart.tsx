import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight } from "lucide-react";

export default function SessionStartPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .single();
    setSession(data);

    const { data: q } = await supabase
      .from("questions")
      .select("*")
      .eq("session_id", id)
      .order("order_index");
    setQuestions(q || []);
    setLoading(false);
  };

  const beginGame = async () => {
    if (!id) return;
    setGenerating(true);

    // If no questions yet, generate them via AI
    if (questions.length === 0) {
      try {
        const { data, error } = await supabase.functions.invoke("generate-questions", {
          body: {
            session_number: session?.session_number || 1,
            language: profile?.language || "en",
            couple_id: profile?.couple_id,
          },
        });

        if (error) throw error;
        // Reload questions
        const { data: q } = await supabase
          .from("questions")
          .select("*")
          .eq("session_id", id)
          .order("order_index");
        setQuestions(q || []);
      } catch (e) {
        console.error("Question generation error:", e);
      }
    }

    // Activate session
    await supabase
      .from("sessions")
      .update({ status: "active" as any })
      .eq("id", id);

    navigate(`/session/${id}/question/1`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const sessionTitles = [
    "Understanding Each Other",
    "Deepening Connection",
    "Growing Together",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
      <div
        className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 text-center endo-shadow"
        style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl endo-gradient">
            <Heart className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>
            Session {session?.session_number}
          </h1>
          <h2 className="text-lg text-muted-foreground">
            {sessionTitles[(session?.session_number || 1) - 1]}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You'll answer a series of questions together. Your answers will only be revealed
            once you've both submitted — creating a safe space for honesty.
          </p>
        </div>

        <Button
          variant="warm"
          size="lg"
          className="w-full"
          onClick={beginGame}
          disabled={generating}
        >
          {generating ? (
            "Preparing questions…"
          ) : (
            <>
              Begin Game <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>

        <Button variant="ghost" onClick={() => navigate("/home")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
