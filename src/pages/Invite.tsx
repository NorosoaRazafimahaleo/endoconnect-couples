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
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) { setInvalid(true); setValidating(false); return; }
      const { data } = await supabase
        .from("couples")
        .select("id")
        .eq("invite_token", token)
        .single();
      if (data) {
        setCoupleId(data.id);
      } else {
        setInvalid(true);
      }
      setValidating(false);
    };
    validate();
  }, [token]);

  // If already logged in and has profile, join couple
  useEffect(() => {
    if (user && profile && coupleId && !profile.couple_id) {
      joinCouple(user.id);
    }
  }, [user, profile, coupleId]);

  const joinCouple = async (userId: string) => {
    await supabase
      .from("profiles")
      .update({
        couple_id: coupleId,
        role: "partner" as any,
        display_name: displayName.trim() || profile?.display_name || "Partner",
        onboarding_complete: true,
      })
      .eq("id", userId);
    await refreshProfile();
    toast.success("You've joined your partner's space!");
    navigate("/home");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Wait for profile trigger, then update
      await new Promise((r) => setTimeout(r, 1000));
      await supabase
        .from("profiles")
        .update({
          couple_id: coupleId,
          role: "partner" as any,
          display_name: displayName.trim() || "Partner",
          onboarding_complete: true,
        })
        .eq("id", data.user.id);

      toast.success("Account created! You've joined your partner's space.");
      navigate("/home");
    }
    setLoading(false);
  };

  if (validating) {
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
          <Button variant="warm" onClick={() => navigate("/signup")}>
            Create your own account
          </Button>
        </div>
      </div>
    );
  }

  if (user && profile?.couple_id) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-8 text-center endo-shadow">
          <h1 className="text-xl font-semibold text-foreground">Already in a couple</h1>
          <p className="text-sm text-muted-foreground">
            You're already connected with a partner.
          </p>
          <Button variant="warm" onClick={() => navigate("/home")}>
            Go to Dashboard
          </Button>
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Your display name</Label>
            <Input
              id="displayName"
              placeholder="How your partner will see you"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" variant="warm" className="w-full" size="lg" disabled={loading}>
            {loading ? "Joining…" : "Join as Partner"}
          </Button>
        </form>
      </div>
    </div>
  );
}
