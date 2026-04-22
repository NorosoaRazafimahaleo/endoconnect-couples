import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, EyeOff, Database, Trash2, Users, Mail, FileText } from "lucide-react";

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
              EndoPartner is built around trust. Here is exactly what we collect, how we use it, and the rights you have over your data.
            </p>
            <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </header>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">What we collect</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li><strong className="text-foreground">Account data:</strong> your email address and a display name.</li>
              <li><strong className="text-foreground">Session content:</strong> your answers to guided questions and the commitments you create.</li>
              <li><strong className="text-foreground">Couple link:</strong> an invite token that connects you to your partner.</li>
              <li><strong className="text-foreground">Language preference</strong> to localize the app.</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              We do <strong>not</strong> collect health records, location, payment information, or any data from third-party trackers.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Who can see your answers</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li>Your answers are <strong className="text-foreground">hidden from your partner</strong> until you both submit your responses for a question.</li>
              <li>No other user, couple, or third party can read your private answers.</li>
              <li>Our team does not read your answers in normal operation. Strict database access controls (Row-Level Security) enforce this at the infrastructure level.</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Community feed (opt-out)</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once a question is revealed to your partner, your answer is shared <strong className="text-foreground">anonymously</strong> with the wider EndoPartner community to help other couples feel less alone. Shared posts include only the answer text — no name, email, or identifier.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You can <strong className="text-foreground">untick the share box on any reveal screen</strong> to keep that answer private, or unshare it later from the same screen.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">How we protect your data</h2>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 leading-relaxed">
              <li>All data is <strong className="text-foreground">encrypted in transit</strong> (HTTPS/TLS) and <strong className="text-foreground">at rest</strong> on our managed backend infrastructure.</li>
              <li>Authentication uses industry-standard hashing and short-lived session tokens.</li>
              <li>Row-Level Security policies ensure each user can only access data that belongs to them or their couple.</li>
              <li>AI-assisted suggestions (e.g. commitment ideas) are processed server-side; raw prompts are never exposed in the browser.</li>
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
              <li><strong className="text-foreground">Deletion:</strong> request full deletion of your account and all associated data by emailing us. We will remove your data within 30 days.</li>
              <li><strong className="text-foreground">Withdraw consent:</strong> untick the community sharing box to remove answers from the public feed.</li>
            </ul>
          </section>

          <div className="text-center pt-4">
            <Button variant="warm" size="lg" onClick={() => navigate("/signup")}>
              Get started — it's free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
