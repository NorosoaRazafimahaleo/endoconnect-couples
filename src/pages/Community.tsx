import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, MessageCircle } from "lucide-react";

interface SharedAnswer {
  id: string;
  is_bookmarked: boolean;
  answers: {
    answer_text: string;
    questions: {
      question_text: string;
      category: string | null;
    };
  };
}

export default function CommunityPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunity();
  }, []);

  const loadCommunity = async () => {
    const { data } = await supabase
      .from("shared_answers")
      .select(`
        id,
        is_bookmarked,
        answers (
          answer_text,
          questions (
            question_text,
            category
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    setAnswers(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => navigate("/home")}
              className="flex items-center gap-2"
              aria-label="Go to home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl endo-gradient">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Community</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 space-y-6">
        <div
          className="space-y-1"
          style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          <h1 className="text-2xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>
            Your shared perspectives
          </h1>
          <p className="text-muted-foreground">
            This is your private space. Only the answers <strong>you or your partner</strong> chose
            to share from your sessions appear here — nothing is visible to other couples, and
            nothing is shared automatically.
          </p>
          <p className="text-xs text-muted-foreground">
            "Opt-in only" means an answer is added here only after you tap "Share" on it during
            a session reveal. You can unshare it any time.
          </p>
        </div>

        {answers.length === 0 ? (
          <div
            className="rounded-2xl border bg-card p-8 text-center space-y-3"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards", opacity: 0 }}
          >
            <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              No shared perspectives yet. Be the first to share an answer from your session!
            </p>
          </div>
        ) : (
          answers.map((item, i) => {
            const answer = (item as any).answers;
            const question = answer?.questions;
            return (
              <div
                key={item.id}
                className="rounded-2xl border bg-card p-6 space-y-3"
                style={{
                  animation: `fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.06}s forwards`,
                  opacity: 0,
                }}
              >
                {question?.category && (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {question.category}
                  </span>
                )}
                <p className="text-sm font-medium text-foreground">
                  {question?.question_text}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{answer?.answer_text}"
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  <span>Anonymous couple</span>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
