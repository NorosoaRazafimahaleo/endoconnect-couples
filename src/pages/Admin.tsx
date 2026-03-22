import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, AlertTriangle, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<any[]>([]);

  useEffect(() => {
    checkRole();
  }, [user]);

  const checkRole = async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "moderator");

    if (data && data.length > 0) {
      setIsAdmin(true);
      await loadData();
    }
    setLoading(false);
  };

  const loadData = async () => {
    const { data: sessions } = await supabase
      .from("live_sessions")
      .select("*")
      .order("starts_at", { ascending: false });
    setLiveSessions(sessions || []);

    const { data: messages } = await supabase
      .from("live_messages")
      .select("*")
      .eq("flagged", true)
      .order("created_at", { ascending: false })
      .limit(20);
    setFlaggedMessages(messages || []);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 endo-gradient-soft">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-8 text-center endo-shadow">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Access Restricted</h1>
          <p className="text-sm text-muted-foreground">
            This area is only accessible to moderators.
          </p>
          <Button variant="warm" onClick={() => navigate("/home")}>
            Go to Dashboard
          </Button>
        </div>
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
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">Moderator Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 space-y-8">
        {/* Live Sessions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Live Sessions</h2>
          </div>

          {liveSessions.length === 0 ? (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-muted-foreground text-sm">No live sessions yet</p>
            </div>
          ) : (
            liveSessions.map((session) => (
              <div key={session.id} className="rounded-xl border bg-card p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{session.topic}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    session.status === "active"
                      ? "bg-green-100 text-green-700"
                      : session.status === "scheduled"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {session.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.starts_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </section>

        {/* Flagged Messages */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Flagged Messages
          </h2>

          {flaggedMessages.length === 0 ? (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="text-muted-foreground text-sm">No flagged messages</p>
            </div>
          ) : (
            flaggedMessages.map((msg) => (
              <div key={msg.id} className="rounded-xl border border-destructive/20 bg-card p-5 space-y-2">
                <p className="text-sm text-foreground">{msg.message_text}</p>
                <p className="text-xs text-muted-foreground">
                  Token: {msg.user_token} · {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
