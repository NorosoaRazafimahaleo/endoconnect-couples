import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Sparkles, PenLine, Home, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadSessionPdf } from "@/lib/sessionPdf";

export default function CommitmentPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSuggestions();
    checkExisting();
  }, [id]);

  const checkExisting = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from("commitments")
      .select("id")
      .eq("session_id", id)
      .eq("user_id", user.id);
    if (data && data.length > 0) setSubmitted(true);
    setLoading(false);
  };

  const loadSuggestions = async () => {
    if (!id) return;
    try {
      const { data } = await supabase.functions.invoke("commitment-suggestions", {
        body: {
          session_id: id,
          user_id: user?.id,
        },
      });
      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch {
      // Fallback suggestions
      setSuggestions([
        "Schedule a weekly check-in about how we're both feeling",
        "Research one new thing about endometriosis together",
        "Practice active listening without offering solutions",
      ]);
    }
  };

  const toggleSuggestion = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
  };

  const handleSubmit = async () => {
    if (!user || !id) return;
    setSubmitting(true);

    const commitments: { session_id: string; user_id: string; commitment_text: string; source: "ai_suggestion" | "free_text" }[] = [];

    selected.forEach((i) => {
      commitments.push({
        session_id: id,
        user_id: user.id,
        commitment_text: suggestions[i],
        source: "ai_suggestion",
      });
    });

    if (freeText.trim()) {
      commitments.push({
        session_id: id,
        user_id: user.id,
        commitment_text: freeText.trim(),
        source: "free_text",
      });
    }

    if (commitments.length === 0) {
      toast.error("Please select or write at least one commitment");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("commitments").insert(commitments);
    if (error) {
      toast.error("Failed to save commitments");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    toast.success("Commitments saved! 💜");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
        <div
          className="w-full max-w-md space-y-6 rounded-2xl bg-card p-8 text-center endo-shadow"
          style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Session Complete!</h1>
          <p className="text-muted-foreground">
            Your commitments have been saved. You'll receive gentle reminders
            at 3 and 7 days to help you follow through.
          </p>
          <Button variant="warm" size="lg" className="w-full" onClick={() => navigate("/home")}>
            <Home className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 endo-gradient-soft">
      <div
        className="w-full max-w-lg space-y-6 rounded-2xl bg-card p-8 endo-shadow"
        style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Make a Commitment</h1>
          <p className="text-sm text-muted-foreground">
            Choose actions you'd like to take based on your conversation
          </p>
        </div>

        {/* AI suggestions */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Suggested for you
          </p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => toggleSuggestion(i)}
              className={`w-full rounded-xl border p-4 text-left text-sm transition-all active:scale-[0.98] ${
                selected.has(i)
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
              style={{
                animation: `fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.08}s forwards`,
                opacity: 0,
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected.has(i) ? "border-primary bg-primary" : "border-muted-foreground"
                }`}>
                  {selected.has(i) && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                </div>
                <span>{s}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Free text */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <PenLine className="h-3 w-3" />
            <span>Or write your own</span>
          </div>
          <Input
            placeholder="Your own commitment (max 200 characters)"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value.slice(0, 200))}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">{freeText.length}/200</p>
        </div>

        <Button
          variant="warm"
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving…" : "Save Commitments"}
        </Button>
      </div>
    </div>
  );
}
