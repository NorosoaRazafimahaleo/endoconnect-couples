import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, ArrowRight, UserPlus, MessageCircle, Sparkles, Lock, EyeOff, Database, Trash2 } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen endo-gradient-soft">
      <div className="container max-w-4xl py-12 px-4">
        {/* Hero */}
        <div
          className="flex flex-col items-center text-center space-y-8 py-16"
          style={{ animation: "fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl endo-gradient endo-shadow-lg">
            <Heart className="h-10 w-10 text-primary-foreground" />
          </div>

          <div className="space-y-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground" style={{ lineHeight: "1.1" }}>
              Understand endometriosis together
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              EndoPartner is a free, private space for couples to learn about endometriosis,
              talk openly, and grow closer through guided conversations.
            </p>
            <p className="text-sm font-medium text-primary">
              100% free — forever. No subscriptions, no hidden costs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="warm" size="lg" onClick={() => navigate("/onboarding")}>
              Start now <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            No account, no email, no password. Just open the app and go.
          </p>

        </div>

        {/* How it works */}
        <div
          className="space-y-6 py-8"
          style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards", opacity: 0 }}
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to start your journey together</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                icon: <UserPlus className="h-5 w-5 text-primary" />,
                title: "Open & invite",
                desc: "Pick a display name and share a private invite link with your partner. No accounts, no email — they join with just a name.",

              },
              {
                step: "2",
                icon: <MessageCircle className="h-5 w-5 text-primary" />,
                title: "Answer privately",
                desc: "Each of you answers thoughtful questions on your own. Your responses stay hidden until you're both ready to share.",
              },
              {
                step: "3",
                icon: <Sparkles className="h-5 w-5 text-primary" />,
                title: "Reveal & commit",
                desc: "Read each other's answers together, turn new understanding into small, meaningful commitments — and export the whole session as a PDF to keep.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border bg-card p-6 space-y-3 hover:endo-shadow transition-shadow relative"
              >
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full endo-gradient text-sm font-semibold text-primary-foreground">
                  {item.step}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-3 py-12">
          {[
            {
              icon: <Heart className="h-6 w-6 text-primary" />,
              title: "Guided Sessions",
              desc: "Three carefully crafted sessions that deepen understanding progressively",
            },
            {
              icon: <Users className="h-6 w-6 text-primary" />,
              title: "Safe Space",
              desc: "Answer honestly knowing your partner can't see until you're both ready",
            },
            {
              icon: <Shield className="h-6 w-6 text-primary" />,
              title: "Real Commitments",
              desc: "Turn insights into action with AI-suggested commitments and reminders",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-2xl border bg-card p-6 space-y-3 hover:endo-shadow transition-shadow"
              style={{
                animation: `fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + i * 0.1}s forwards`,
                opacity: 0,
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy */}
        <div
          className="py-12 space-y-6"
          style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards", opacity: 0 }}
        >
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Your privacy, protected</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              What you share here stays between you and your partner. Always.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: <EyeOff className="h-5 w-5 text-primary" />,
                title: "Private by default",
                desc: "Your answers are hidden from your partner until you both submit your responses.",
              },
              {
                icon: <Shield className="h-5 w-5 text-primary" />,
                title: "Encrypted & secure",
                desc: "Data is encrypted in transit and at rest. Authentication and storage are handled by industry-standard infrastructure.",
              },
              {
                icon: <Database className="h-5 w-5 text-primary" />,
                title: "No selling, no ads",
                desc: "We never sell your data, share it with third parties, or use it for advertising. This app is free and will stay that way.",
              },
              {
                icon: <Trash2 className="h-5 w-5 text-primary" />,
                title: "You're in control",
                desc: "You can reset your data anytime from the home screen — it clears everything on your device. Anonymized community posts are opt-in only.",
              },

            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-5 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA footer */}
        <div
          className="text-center py-8 space-y-4"
          style={{ animation: "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards", opacity: 0 }}
        >
          <h2 className="text-xl font-semibold text-foreground">Ready to start?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            It takes less than a minute to create your space and invite your partner.
          </p>
          <Button variant="warm" size="lg" onClick={() => navigate("/onboarding")}>
            Create your free space <ArrowRight className="h-4 w-4 ml-1" />
          </Button>

          <div className="pt-4">
            <button
              onClick={() => navigate("/privacy")}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Read our full Data & Privacy policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
