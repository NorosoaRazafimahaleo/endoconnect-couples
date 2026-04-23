import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";

export default function QuestionPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [existingAnswer, setExistingAnswer] = useState<any>(null);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const questionIndex = parseInt(n || "1") - 1;

  useEffect(() => {
    loadQuestion();
  }, [id, n]);

  const loadQuestion = async () => {
    if (!id) return;

    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("session_id", id)
      .order("order_index");

    if (!questions || questions.length === 0) {
      setLoading(false);
      return;
    }

    setTotalQuestions(questions.length);
    const q = questions[questionIndex];
    if (!q) {
      // No more questions, go to commitment
      navigate(`/session/${id}/commitment`);
      return;
    }
    setQuestion(q);

    // Check if user already answered
    if (user) {
      const { data: myAnswer } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", q.id)
        .eq("user_id", user.id)
       .maybeSingle(); //.single(); at first. Now Question page loads without answer
      if (myAnswer) {
        setExistingAnswer(myAnswer);
        setAnswer(myAnswer.answer_text);
      }

      // Check if partner answered (any other answer for this question)
      const { data: otherAnswers } = await supabase
        .from("answers")
        .select("id")
        .eq("question_id", q.id)
        .neq("user_id", user.id);
      setPartnerAnswered((otherAnswers?.length || 0) > 0);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!question || !user || !answer.trim()) return;
    setSubmitting(true);

    if (existingAnswer) {
      // Already submitted
      handleNext();
      return;
    }

    const { error } = await supabase.from("answers").insert({
      question_id: question.id,
      user_id: user.id,
      answer_text: answer.trim(),
    });

    if (error) {
      toast.error("Failed to submit answer");
      setSubmitting(false);
      return;
    }

    setExistingAnswer({ answer_text: answer.trim() });

    // Reload partner status
    const { data: otherAnswers } = await supabase
      .from("answers")
      .select("id")
      .eq("question_id", question.id)
      .neq("user_id", user.id);
    const partnerDone = (otherAnswers?.length || 0) > 0;
    setPartnerAnswered(partnerDone);

    if (partnerDone) {
      navigate(`/session/${id}/reveal/${n}`);
    } else {
      toast.success("Answer submitted! Waiting for your partner…");
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (existingAnswer && partnerAnswered) {
      navigate(`/session/${id}/reveal/${n}`);
    } else {
      const nextQ = questionIndex + 2;
      if (nextQ > totalQuestions) {
        navigate(`/session/${id}/commitment`);
      } else {
        navigate(`/session/${id}/question/${nextQ}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No questions available yet.</p>
          <Button variant="warm" onClick={() => navigate(`/session/${id}/start`)}>
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
      <div
        className="w-full max-w-lg space-y-6 rounded-2xl bg-card p-8 endo-shadow"
        style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Question {questionIndex + 1} of {totalQuestions}</span>
            {question.category && (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {question.category}
              </span>
            )}
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-full rounded-full endo-gradient transition-all duration-500"
              style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-xl font-semibold text-foreground leading-relaxed" style={{ lineHeight: "1.4" }}>
          {question.question_text}
        </h2>

        {/* Answer area */}
        <div className="space-y-4">
          <Textarea
            placeholder="Share your thoughts honestly…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value.slice(0, 5000))}
            disabled={!!existingAnswer}
            maxLength={5000}
            className="min-h-[120px] resize-none"
          />
          {!existingAnswer && (
            <p className="text-xs text-muted-foreground text-right">
              {answer.length}/5000
            </p>
          )}

          {existingAnswer && !partnerAnswered && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-secondary p-3">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>Waiting for your partner to answer…</span>
            </div>
          )}

          {existingAnswer && partnerAnswered && (
            <Button
              variant="warm"
              className="w-full"
              size="lg"
              onClick={() => navigate(`/session/${id}/reveal/${n}`)}
            >
              See Both Answers <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {!existingAnswer && (
            <Button
              variant="warm"
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
            >
              {submitting ? "Submitting…" : "Submit Answer"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
