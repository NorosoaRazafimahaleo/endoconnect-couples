import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Copy, Check, Globe } from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [language, setLanguage] = useState(profile?.language || "en");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNameAndLanguage = async () => {
    if (!displayName.trim()) return;
    if (!user) {
      toast.error("We're still setting things up — try again in a moment");
      return;
    }
    setLoading(true);


    const { data, error } = await supabase.rpc("create_couple_and_link", {
      _display_name: displayName.trim(),
      _language: language,
    });

    if (error || !data || data.length === 0) {
      console.error("create_couple_and_link error:", error);
      toast.error(error?.message || "Failed to set up your space");
      setLoading(false);
      return;
    }

    const { invite_token } = data[0];
    const link = `${window.location.origin}/invite/${invite_token}`;
    setInviteLink(link);
    await refreshProfile();
    setLoading(false);
    setStep(2);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const finish = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);
    await refreshProfile();
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
      <div
        className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 endo-shadow"
        style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl endo-gradient">
                <Globe className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Let's get started
              </h1>
              <p className="text-sm text-muted-foreground">
                Tell us a bit about yourself
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Your display name</Label>
                <Input
                  id="displayName"
                  placeholder="How your partner will see you"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Language for your session questions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLanguage(l.code)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97] ${
                        language === l.code
                          ? "border-primary bg-secondary text-secondary-foreground"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="warm"
                className="w-full"
                size="lg"
                onClick={handleNameAndLanguage}
                disabled={!displayName.trim() || loading}
              >
                {loading ? "Setting up…" : "Continue"}
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl endo-gradient">
                <Heart className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Invite your partner
              </h1>
              <p className="text-sm text-muted-foreground">
                Share this link so they can join your space
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                <p className="flex-1 truncate text-sm text-foreground">{inviteLink}</p>
                <Button variant="soft" size="sm" onClick={copyLink} aria-label="Copy invite link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <Button variant="warm" className="w-full" size="lg" onClick={finish}>
                Continue to Dashboard
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                You can also copy this link later from your home screen
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
