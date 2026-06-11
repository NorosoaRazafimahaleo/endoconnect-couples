import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Play, Lock, CheckCircle, LogOut, Users, Copy, Check, Download, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { downloadSessionPdf } from "@/lib/sessionPdf";

interface SessionData {
  id: string;
  session_number: number;
  status: "pending" | "active" | "completed";
}

export default function HomePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [creatingInvite, setCreatingInvite] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile?.couple_id, user?.id]);

  const generateInviteToken = () => {
    return `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  };

  const loadData = async (coupleIdOverride?: string) => {
    const coupleId = coupleIdOverride ?? profile?.couple_id;

    if (!coupleId) {
      setSessions([]);
      setPartnerName(null);
      setInviteToken(null);
      setLoading(false);
      return;
    }

    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*")
      .eq("couple_id", coupleId)
      .order("session_number");

    setSessions((sessionsData as SessionData[]) || []);

    const { data: partner } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("couple_id", coupleId)
      .neq("id", user!.id)
      .maybeSingle();

    setPartnerName(partner?.display_name || null);

    if (!partner) {
      const { data: couple } = await supabase
        .from("couples")
        .select("invite_token")
        .eq("id", coupleId)
        .maybeSingle();

      if (!couple?.invite_token) {
        const newInviteToken = generateInviteToken();
        const { data: updatedCouple, error: updateError } = await supabase
          .from("couples")
          .update({ invite_token: newInviteToken })
          .eq("id", coupleId)
          .select("invite_token")
          .single();

        if (updateError) {
          toast.error("We couldn't restore your invite link yet");
          setInviteToken(null);
        } else {
          setInviteToken(updatedCouple?.invite_token || newInviteToken);
        }
      } else {
        setInviteToken(couple.invite_token);
      }
    } else {
      setInviteToken(null);
    }

    setLoading(false);
  };

  const createInviteSpace = async () => {
    setCreatingInvite(true);

    const fallbackName =
      profile?.display_name?.trim() || user?.email?.split("@")[0] || "You";

    const { data, error } = await supabase.rpc("create_couple_and_link", {
      _display_name: fallbackName,
      _language: profile?.language || "en",
    });

    if (error || !data || data.length === 0) {
      toast.error(error?.message || "We couldn't create your invite link yet");
      setCreatingInvite(false);
      return;
    }

    const created = data[0];
    setInviteToken(created.invite_token);
    await refreshProfile();
    await loadData(created.couple_id);
    toast.success("Your invite link is ready");
    setCreatingInvite(false);
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
    if (index > 0 && sessions[index - 1]?.status !== "completed") {
      return <Lock className="h-5 w-5 text-muted-foreground" />;
    }
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
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-4">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-3"
            aria-label="Go to home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl endo-gradient">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">EndoPartner</span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/community")}>
              <Users className="mr-1 h-4 w-4" /> Community
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/contact")}>
              <MessageSquare className="mr-1 h-4 w-4" /> Contact
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl space-y-8 py-8">
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
              : profile?.couple_id
                ? "Your invite link is ready to share with your partner"
                : "Let's finish setting up your space and create your invite link"}
          </p>
        </div>

        {!profile?.couple_id && (
          <div
            className="space-y-3 rounded-2xl border bg-card p-6 endo-shadow"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards", opacity: 0 }}
          >
            <h2 className="font-semibold text-foreground">Create your invite link</h2>
            <p className="text-sm text-muted-foreground">
              Your setup was not fully saved before. Create a fresh link and send it to your partner.
            </p>
            <Button variant="warm" onClick={createInviteSpace} disabled={creatingInvite}>
              {creatingInvite ? "Creating link…" : "Create invite link"}
            </Button>
          </div>
        )}

        {!partnerName && inviteToken && (
          <div
            className="space-y-3 rounded-2xl border bg-card p-6 endo-shadow"
            style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards", opacity: 0 }}
          >
            <h2 className="font-semibold text-foreground">Invite your partner</h2>
            <p className="text-sm text-muted-foreground">
              Share this link with your partner so they can join your space.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border bg-muted px-3 py-2 text-sm text-foreground">
                {`${window.location.origin}/invite/${inviteToken}`}
              </div>
              <Button variant="soft" size="sm" onClick={copyInvite} aria-label="Copy invite link">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {profile?.couple_id && sessions.length > 0 && (
          <div className="space-y-4">
            <div
              className="space-y-1"
              style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards", opacity: 0 }}
            >
              <h2 className="text-lg font-semibold text-foreground">Guided sessions</h2>
              <p className="text-sm text-muted-foreground">
                These are the guided conversations you will move through together.
              </p>
            </div>
            {sessions.map((session, i) => (
              <div
                key={session.id}
                className={`rounded-2xl border bg-card p-6 transition-all ${
                  isLocked(i) ? "opacity-50" : "hover:endo-shadow"
                }`}
                style={{
                  animation: `fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.08}s forwards`,
                  opacity: 0,
                }}
              >
                <button
                  onClick={() => !isLocked(i) && startSession(session)}
                  disabled={isLocked(i)}
                  className={`w-full text-left ${isLocked(i) ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                      {getSessionIcon(session, i)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        Session {session.session_number}: {sessionTitles[session.session_number - 1]}
                      </h3>
                      <p className="text-sm capitalize text-muted-foreground">
                        {session.status === "completed" ? "Completed ✓" : session.status}
                      </p>
                    </div>
                  </div>
                </button>
                {session.status === "completed" && (
                  <Button
                    variant="soft"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!user || !profile) return;
                      try {
                        await downloadSessionPdf({
                          sessionId: session.id,
                          userId: user.id,
                          myName: profile.display_name || "You",
                          partnerName: partnerName || "Your partner",
                        });
                        toast.success("Session PDF downloaded 💜");
                      } catch (err: any) {
                        toast.error(err?.message || "Could not generate PDF");
                      }
                    }}
                  >
                    <Download className="mr-1 h-4 w-4" /> Download answers (PDF)
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
