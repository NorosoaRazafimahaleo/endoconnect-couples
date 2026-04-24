import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "reach_out", label: "Want to reach out" },
  { value: "suggestion", label: "Suggestion" },
  { value: "bug", label: "Bug / error report" },
] as const;

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Please enter a valid email").max(255).optional().or(z.literal("")),
  category: z.enum(["reach_out", "suggestion", "bug"]),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

export default function ContactPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.display_name || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [category, setCategory] = useState<"reach_out" | "suggestion" | "bug">("reach_out");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, category, subject, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Please check the form");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null,
      name: name.trim() || null,
      email: email.trim() || null,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Could not send your message. Please try again.");
      return;
    }
    toast.success("Thank you! Your message has been sent 💜");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <button
            onClick={() => navigate(user ? "/home" : "/")}
            className="flex items-center gap-3"
            aria-label="Go to home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl endo-gradient">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">EndoPartner</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      <main className="container max-w-xl py-8">
        <div className="space-y-6 rounded-2xl border bg-card p-6 endo-shadow">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Get in touch</h1>
            <p className="text-sm text-muted-foreground">
              Want to reach out, share a suggestion, or report a bug? We'd love to hear from you.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>What's this about?</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                      category === c.value
                        ? "border-primary bg-secondary text-secondary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your name (optional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Reply-to email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Briefly, what's on your mind?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={6}
                placeholder="Tell us more…"
                required
              />
              <p className="text-right text-xs text-muted-foreground">
                {message.length} / 2000
              </p>
            </div>

            <Button type="submit" variant="warm" size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending…" : (<><Send className="mr-1 h-4 w-4" /> Send message</>)}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Your message goes to the EndoPartner team at nosrazaei@gmail.com
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
