import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Heart, Users } from "lucide-react";
import { toast } from "sonner";

export default function RevealPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<any>(null);
  const [myAnswer, setMyAnswer] = useState<string>("");
  const [partnerAnswer, setPartnerAnswer] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("Your partner");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [myAnswerId, setMyAnswerId] = useState<string>("");
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);

  const questionIndex = parseInt(n || "1") - 1;

  useEffect(() => {
    loadReveal();
  }, [id, n]);

  const loadReveal = async () => {
    if (!id || !user) return;

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("session_id", id)
      .order("order_index");

    if (!questions) { setLoading(false); return; }
    setTotalQuestions(questions.length);

    const q = questions[questionIndex];
    if (!q) { setLoading(false); return; }
    setQuestion(q);

    // Get all answers for this question
    const { data: answers } = await supabase
      .from("answers")
      .select("*")
      .eq("question_id", q.id);

    if (answers) {
      const mine = answers.find((a) => a.user_id === user.id);
      const theirs = answers.find((a) => a.user_id !== user.id);
      setMyAnswer(mine?.answer_text || "");
      setPartnerAnswer(theirs?.answer_text || "Not answered yet");
      setMyAnswerId(mine?.id || "");

      if (mine?.id && profile?.couple_id) {
        const { data: existingShare } = await supabase
          .from("shared_answers")
          .select("id")
          .eq("answer_id", mine.id)
          .maybeSingle();

        setShared(!!existingShare);
      }
    }

    // Get partner name
    if (profile?.couple_id) {
      const { data: partner } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("couple_id", profile.couple_id)
        .neq("id", user.id)
        .single();
      if (partner?.display_name) setPartnerName(partner.display_name);
    }

    setLoading(false);
  };

  const handleNext = async () => {
    const nextQ = questionIndex + 2;
    if (nextQ > totalQuestions) {
      // Session complete — mark and go to commitment
      await supabase
        .from("sessions")
        .update({ status: "completed" as any, completed_at: new Date().toISOString() })
        .eq("id", id);

      // Create next session if applicable
      const { data: session } = await supabase
        .from("sessions")
        .select("session_number, couple_id")
        .eq("id", id!)
        .single();

      if (session && session.session_number < 3) {
        await supabase.from("sessions").insert({
          couple_id: session.couple_id,
          session_number: session.session_number + 1,
          status: "pending" as any,
        });
      }

      navigate(`/session/${id}/commitment`);
    } else {
      navigate(`/session/${id}/question/${nextQ}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 endo-gradient-soft">
      <div
        className="w-full max-w-2xl space-y-6 rounded-2xl bg-card p-8 endo-shadow"
        style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Progress */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Question {questionIndex + 1} of {totalQuestions} — Reveal
          </p>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full endo-gradient transition-all duration-500"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-lg font-semibold text-foreground leading-relaxed" style={{ lineHeight: "1.4" }}>
          {question?.question_text}
        </h2>

        {/* Side by side answers */}
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="rounded-xl border bg-secondary/50 p-5 space-y-2"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards", opacity: 0 }}
          >
            <p className="text-xs font-medium text-primary uppercase tracking-wider">
              {profile?.display_name || "You"}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{myAnswer}</p>
          </div>
          <div
            className="rounded-xl border bg-secondary/50 p-5 space-y-2"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards", opacity: 0 }}
          >
            <p className="text-xs font-medium text-endo-warm uppercase tracking-wider">
              {partnerName}
            </p>
            <p className="text-sm text-foreground leading-relaxed">{partnerAnswer}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 text-primary" />
          <span>Take a moment to discuss before moving on</span>
        </div>

        {myAnswerId && (
          <label
            className={`flex items-start gap-3 rounded-xl border bg-secondary/30 p-4 cursor-pointer transition-all ${
              shared ? "border-primary" : "border-border hover:bg-secondary/50"
            } ${sharing ? "opacity-60 pointer-events-none" : ""}`}
          >
            <Checkbox
              checked={shared}
              disabled={sharing}
              onCheckedChange={async (checked) => {
                if (!profile?.couple_id) return;
                setSharing(true);
                if (checked) {
                  const { error } = await supabase.from("shared_answers").insert({
                    answer_id: myAnswerId,
                    couple_id: profile.couple_id,
                  });
                  setSharing(false);
                  if (error) {
                    toast.error("Couldn't share. Please try again.");
                    return;
                  }
                  setShared(true);
                  toast.success("Shared anonymously with the community 💜");
                } else {
                  const { error } = await supabase
                    .from("shared_answers")
                    .delete()
                    .eq("answer_id", myAnswerId);
                  setSharing(false);
                  if (error) {
                    toast.error("Couldn't remove. Please try again.");
                    return;
                  }
                  setShared(false);
                  toast.success("Removed from the community feed");
                }
              }}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Share my answer anonymously with the community
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Shared by default to help other couples. Untick to keep this answer private — your name, email, and partner are never shown either way.
              </p>
            </div>
          </label>
        )}

        <Button variant="warm" className="w-full" size="lg" onClick={handleNext}>
          {questionIndex + 1 >= totalQuestions ? "View Commitments" : "Next Question"}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
