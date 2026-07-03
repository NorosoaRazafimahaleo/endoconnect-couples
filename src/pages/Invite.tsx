import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, profile, loading: authLoading, refreshProfile, resetLocalAccount } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [inviteCoupleId, setInviteCoupleId] = useState<string | null>(null);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setInvalid(true);
        setValidating(false);
        return;
      }
      // Wait for the anonymous session to be ready before calling RPCs
      if (authLoading || !user) return;
      const { data, error } = await supabase.rpc("get_couple_id_for_token", { _token: token });
      if (error || !data) {
        setInvalid(true);
      } else {
        setInviteCoupleId(data as string);
      }
      setValidating(false);
    };
    validate();
  }, [token, authLoading, user]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !displayName.trim() || !user) return;
    setLoading(true);

    const { error } = await supabase.rpc("join_couple_with_token", {
      _token: token,
      _display_name: displayName.trim(),
    });

    if (error) {
      toast.error("Could not join: " + error.message);
      setLoading(false);
      return;
    }
    await refreshProfile();
    toast.success("You've joined your partner's space!");
    navigate("/home");
  };

  if (authLoading || validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-8 text-center endo-shadow">
          <h1 className="text-xl font-semibold text-foreground">Invalid invite link</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is not valid or has already been used.
          </p>
          <Button variant="warm" onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </div>
    );
  }

  // Already in a couple on this device
  if (profile?.couple_id) {
    const sameCouple = inviteCoupleId && profile.couple_id === inviteCoupleId;
    return (
      <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-8 text-center endo-shadow">
          <h1 className="text-xl font-semibold text-foreground">
            {sameCouple ? "You're all set 💜" : "This device is already in a couple"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {sameCouple
              ? "You and your partner are already connected through this link."
              : "This browser is already linked to another space. Reset it to join a new invite."}
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="warm" onClick={() => navigate("/home")}>
              Go to Dashboard
            </Button>
            {!sameCouple && (
              <Button
                variant="soft"
                onClick={async () => {
                  await resetLocalAccount();
                  toast.success("Local data reset. Joining as a new partner…");
                }}
              >
                Reset this device and join
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
      <div
        className="w-full max-w-md space-y-8 rounded-2xl bg-card p-8 endo-shadow"
        style={{ animation: "scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl endo-gradient">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            You've been invited
          </h1>
          <p className="text-sm text-muted-foreground">
            Your partner wants to learn and grow with you
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">What should we call you?</Label>
            <Input
              id="displayName"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="warm"
            className="w-full"
            size="lg"
            disabled={loading || !displayName.trim()}
          >
            {loading ? "Joining…" : "Join as Partner"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No account or password needed.
          </p>
        </form>
      </div>
    </div>
  );
}
