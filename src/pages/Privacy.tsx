import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, EyeOff, Database, Trash2, Users, FileText, UserX } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen endo-gradient-soft">
      <div className="container max-w-3xl py-12 px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="space-y-8">
          <header className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Data & Privacy</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              EndoPartner works without sign-ups. No email, no password, no profile. Here is exactly what that means for your data.
            </p>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </header>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <UserX className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">No accounts, no personal identity</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You never create an account. We never ask for your name, email, phone number, or date of birth. When you first open the app, an anonymous session is generated on your device so your progress can sync with your partner — that's it.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Because there is no account, there is nothing to log into and nothing to recover. Clearing your device data or tapping <strong className="text-foreground">Reset my data</strong> erases your session permanently.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">What we store</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li><strong className="text-foreground">A display name</strong> you choose (can be a nickname or initials).</li>
              <li><strong className="text-foreground">Your language preference</strong> to localize the app.</li>
              <li><strong className="text-foreground">Session content:</strong> your answers to guided questions and the commitments you create together.</li>
              <li><strong className="text-foreground">A couple link:</strong> a random invite token that connects your device to your partner's.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              We do <strong>not</strong> collect health records, symptoms, medical history, location, contacts, payment information, IP-based profiles, or any data from third-party trackers.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Who can see your answers</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li>Your answers are <strong className="text-foreground">hidden from your partner</strong> until you both submit your responses for a question.</li>
              <li>No other user or couple can read your private answers.</li>
              <li>Our team does not read your answers in normal operation. Row-Level Security policies enforce this at the database level, so answers are only ever returned to the two devices in your couple.</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Community feed (opt-in)</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The community feed is <strong className="text-foreground">strictly opt-in</strong>. Nothing you write is shared until you tick the share box on a reveal screen. Shared posts contain only the answer text — no display name, no couple link, no identifier of any kind.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can unshare any answer later from the same screen.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">How we protect your data</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li>All data is <strong className="text-foreground">encrypted in transit</strong> (HTTPS/TLS) and <strong className="text-foreground">at rest</strong> on our managed backend infrastructure.</li>
              <li>Anonymous sessions use short-lived tokens stored only on your device.</li>
              <li>Row-Level Security ensures each device can only access data belonging to its own couple.</li>
              <li>AI-assisted suggestions are processed server-side; prompts and API keys never touch the browser.</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">No selling, no ads, no tracking</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not sell your data, share it with advertisers, or use it for targeted advertising. EndoPartner is free and contains no third-party advertising or analytics trackers.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Your rights</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li><strong className="text-foreground">Access & export:</strong> download any completed session as a PDF directly from the app.</li>
              <li><strong className="text-foreground">Correction:</strong> edit your display name and language at any time from your profile.</li>
              <li><strong className="text-foreground">Deletion:</strong> tap <strong>Reset my data</strong> on the home screen to permanently delete your anonymous session, answers, commitments, and couple link. There is nothing to email us about — the delete happens immediately from your device.</li>
              <li><strong className="text-foreground">Withdraw consent:</strong> untick the community sharing box on any reveal screen to remove that answer from the public feed.</li>
            </ul>
          </section>

          <div className="text-center pt-4">
            <Button variant="warm" size="lg" onClick={() => navigate("/onboarding")}>
              Get started — no sign-up needed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
