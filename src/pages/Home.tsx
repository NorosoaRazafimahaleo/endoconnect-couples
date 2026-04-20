import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Play, Lock, CheckCircle, LogOut, Users, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadSessionPdf } from "@/lib/sessionPdf";

interface SessionData {
  id: string;
  session_number: number;
  status: "pending" | "active" | "completed";
}

export default function HomePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.couple_id) { setLoading(false); return; }

    // Load sessions
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*")
      .eq("couple_id", profile.couple_id)
      .order("session_number");

    setSessions((sessionsData as SessionData[]) || []);

    // Load partner
    const { data: partner } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("couple_id", profile.couple_id)
      .neq("id", user!.id)
      .single();

    setPartnerName(partner?.display_name || null);

    // Load invite token if no partner
    if (!partner) {
      const { data: couple } = await supabase
        .from("couples")
        .select("invite_token")
        .eq("id", profile.couple_id)
        .single();
      setInviteToken(couple?.invite_token || null);
    }

    setLoading(false);
  };

  const copyInvite = () => {
    if (!inviteToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteToken}`);
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const startSession = async (session: SessionData) => {
    if (session.status === "completed") {
      navigate(`/session/${session.id}/reveal/1`);
      return;
    }
    navigate(`/session/${session.id}/start`);
  };

  const getSessionIcon = (session: SessionData, index: number) => {
    if (session.status === "completed") return <CheckCircle className="h-5 w-5 text-primary" />;
    if (index > 0 && sessions[index - 1]?.status !== "completed")
      return <Lock className="h-5 w-5 text-muted-foreground" />;
    return <Play className="h-5 w-5 text-primary" />;
  };

  const isLocked = (index: number) => {
    return index > 0 && sessions[index - 1]?.status !== "completed";
  };

  const sessionTitles = [
    "Understanding Each Other",
    "Deepening Connection",
    "Growing Together",
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl endo-gradient">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">EndoPartner</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
              <Users className="h-4 w-4 mr-1" /> Community
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 space-y-8">
        {/* Welcome */}
        <div
          className="space-y-1"
          style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          <h1 className="text-2xl font-semibold text-foreground" style={{ lineHeight: "1.2" }}>
            Welcome back, {profile?.display_name || "there"} 💜
          </h1>
          <p className="text-muted-foreground">
            {partnerName
              ? `You and ${partnerName} are on this journey together`
              : "Invite your partner to begin your sessions"
            }
          </p>
        </div>

        {/* No partner banner */}
        {!partnerName && inviteToken && (
          <div
            className="rounded-2xl border bg-card p-6 space-y-3 endo-shadow"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards", opacity: 0 }}
          >
            <h2 className="font-semibold text-foreground">Invite your partner</h2>
            <p className="text-sm text-muted-foreground">
              Share this link with your partner so they can join your space
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border bg-muted px-3 py-2 text-sm text-foreground">
                {`${window.location.origin}/invite/${inviteToken}`}
              </div>
              <Button variant="soft" size="sm" onClick={copyInvite}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Sessions */}
        <div className="space-y-4">
          <h2
            className="text-lg font-semibold text-foreground"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards", opacity: 0 }}
          >
            Your Sessions
          </h2>
          {sessions.map((session, i) => (
            <button
              key={session.id}
              onClick={() => !isLocked(i) && startSession(session)}
              disabled={isLocked(i)}
              className={`w-full rounded-2xl border bg-card p-6 text-left transition-all active:scale-[0.98] ${
                isLocked(i)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:endo-shadow cursor-pointer"
              }`}
              style={{
                animation: `fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.08}s forwards`,
                opacity: 0,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  {getSessionIcon(session, i)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    Session {session.session_number}: {sessionTitles[session.session_number - 1]}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {session.status === "completed" ? "Completed ✓" : session.status}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
