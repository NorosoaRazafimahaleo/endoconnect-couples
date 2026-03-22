import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, ArrowRight } from "lucide-react";

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
              EndoPartner helps couples navigate endometriosis through guided conversations,
              shared understanding, and meaningful commitments.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="warm" size="lg" onClick={() => navigate("/signup")}>
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="soft" size="lg" onClick={() => navigate("/login")}>
              Sign In
            </Button>
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
                animation: `fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.1}s forwards`,
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
      </div>
    </div>
  );
}
