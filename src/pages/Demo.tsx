import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, ArrowRight, Clock, Download, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

type Phase = "start" | "question" | "waiting" | "reveal" | "commitment" | "done";

const DEMO_QUESTIONS = [
  { text: "What is one thing about living with endometriosis you wish your partner understood better?", category: "Understanding" },
  { text: "When pain flares up, what kind of support feels most helpful — words, presence, or space?", category: "Support" },
  { text: "What is one small daily gesture that makes you feel cared for?", category: "Connection" },
  { text: "How do you want to navigate intimacy together during difficult weeks?", category: "Intimacy" },
  { text: "What is one thing you'd like to commit to as a couple this month?", category: "Commitment" },
];

const FAKE_PARTNER_ANSWERS = [
  "I want to understand how unpredictable the pain can be, and that you're not exaggerating when you cancel plans.",
  "Just being present is enough — I don't need to fix it, I just want to be there with you.",
  "When I bring you tea in the morning without being asked. It's small but it means I'm thinking of you.",
  "Let's talk openly about what feels good and what doesn't, no pressure on either side.",
  "Checking in with each other every Sunday evening about how the week felt.",
];

const FAKE_PARTNER_COMMITMENTS = [
  "I'll ask 'how are you really feeling?' at least once a day.",
  "I'll plan low-energy date nights for the hard weeks.",
];

function Shell({ children, max = "max-w-lg" }: { children: React.ReactNode; max?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 endo-gradient-soft">
      <div className={`w-full ${max} space-y-6 rounded-2xl bg-card p-8 endo-shadow`}>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Demo Mode</span>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Exit</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DemoPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("start");
  const [qIndex, setQIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState<string[]>(Array(DEMO_QUESTIONS.length).fill(""));
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [myCommitments, setMyCommitments] = useState<string[]>([""]);

  const myName = "You (Demo)";
  const partnerName = "Alex (Demo Partner)";
  const total = DEMO_QUESTIONS.length;

  const submitAnswer = () => {
    if (!currentAnswer.trim()) return;
    const next = [...myAnswers];
    next[qIndex] = currentAnswer.trim();
    setMyAnswers(next);
    setPhase("waiting");
    // Simulate partner answering
    setTimeout(() => setPhase("reveal"), 1200);
  };

  const goNext = () => {
    if (qIndex + 1 >= total) {
      setPhase("commitment");
    } else {
      setQIndex(qIndex + 1);
      setCurrentAnswer("");
      setPhase("question");
    }
  };

  const updateCommitment = (i: number, v: string) => {
    const next = [...myCommitments];
    next[i] = v;
    setMyCommitments(next);
  };

  const finishCommitments = () => {
    if (!myCommitments.some((c) => c.trim())) {
      toast.error("Add at least one commitment");
      return;
    }
    setPhase("done");
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeWrapped = (text: string, size: number, opts?: { bold?: boolean; color?: [number, number, number] }) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
      if (opts?.color) doc.setTextColor(...opts.color);
      else doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = size * 1.35;
      ensureSpace(lines.length * lineHeight);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight;
    };

    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pageWidth, 80, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EndoPartner", margin, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Demo Session — Reflections", margin, 60);
    y = 110;

    writeWrapped(`Date: ${new Date().toLocaleDateString()}`, 10, { color: [110, 110, 110] });
    writeWrapped(`Between: ${myName} & ${partnerName}`, 10, { color: [110, 110, 110] });
    y += 8;

    DEMO_QUESTIONS.forEach((q, i) => {
      y += 12;
      ensureSpace(60);
      writeWrapped(`Question ${i + 1}`, 10, { bold: true, color: [124, 58, 237] });
      writeWrapped(q.text, 13, { bold: true });
      y += 6;
      writeWrapped(`${myName}:`, 10, { bold: true, color: [80, 80, 80] });
      writeWrapped(myAnswers[i] || "— No answer —", 11);
      y += 4;
      writeWrapped(`${partnerName}:`, 10, { bold: true, color: [80, 80, 80] });
      writeWrapped(FAKE_PARTNER_ANSWERS[i], 11);
      y += 8;
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    });

    y += 12;
    ensureSpace(40);
    writeWrapped("Commitments", 16, { bold: true, color: [124, 58, 237] });
    y += 4;
    writeWrapped(`${myName}:`, 11, { bold: true });
    myCommitments.filter((c) => c.trim()).forEach((c) => writeWrapped(`• ${c}`, 11));
    y += 4;
    writeWrapped(`${partnerName}:`, 11, { bold: true });
    FAKE_PARTNER_COMMITMENTS.forEach((c) => writeWrapped(`• ${c}`, 11));

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`EndoPartner • Page ${p} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: "center" });
    }
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = "endopartner-demo-session.pdf";
      a.rel = "noopener";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      try { window.open(url, "_blank", "noopener,noreferrer"); }
      catch { window.location.href = url; }
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  // ---------- Render ----------
  // NOTE: Shell is defined OUTSIDE the component (see below) to prevent it from
  // being recreated on every render, which would unmount/remount inputs and
  // cause focus loss on every keystroke.

  if (phase === "start") {
    return (
      <Shell>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl endo-gradient">
            <Heart className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Demo Session</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Walk through the full funnel with a simulated partner who answers automatically. No sign-in, no waiting. End with a downloadable PDF.
          </p>
        </div>
        <Button variant="warm" size="lg" className="w-full" onClick={() => setPhase("question")}>
          Start Demo <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Shell>
    );
  }

  if (phase === "question") {
    const q = DEMO_QUESTIONS[qIndex];
    return (
      <Shell>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Question {qIndex + 1} of {total}</span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{q.category}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full endo-gradient transition-all duration-500" style={{ width: `${((qIndex + 1) / total) * 100}%` }} />
          </div>
        </div>
        <h2 className="text-xl font-semibold leading-relaxed">{q.text}</h2>
        <Textarea
          placeholder="Share your thoughts honestly…"
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <Button variant="warm" size="lg" className="w-full" onClick={submitAnswer} disabled={!currentAnswer.trim()}>
          Submit Answer
        </Button>
      </Shell>
    );
  }

  if (phase === "waiting") {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Clock className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm text-muted-foreground">Your partner is answering…</p>
        </div>
      </Shell>
    );
  }

  if (phase === "reveal") {
    const q = DEMO_QUESTIONS[qIndex];
    return (
      <Shell max="max-w-2xl">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Question {qIndex + 1} of {total} — Reveal</p>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full endo-gradient transition-all duration-500" style={{ width: `${((qIndex + 1) / total) * 100}%` }} />
          </div>
        </div>
        <h2 className="text-lg font-semibold leading-relaxed">{q.text}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-secondary/50 p-5 space-y-2">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">{myName}</p>
            <p className="text-sm leading-relaxed">{myAnswers[qIndex]}</p>
          </div>
          <div className="rounded-xl border bg-secondary/50 p-5 space-y-2">
            <p className="text-xs font-medium text-endo-warm uppercase tracking-wider">{partnerName}</p>
            <p className="text-sm leading-relaxed">{FAKE_PARTNER_ANSWERS[qIndex]}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 text-primary" />
          <span>Take a moment to discuss before moving on</span>
        </div>
        <Button variant="warm" size="lg" className="w-full" onClick={goNext}>
          {qIndex + 1 >= total ? "View Commitments" : "Next Question"} <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Shell>
    );
  }

  if (phase === "commitment") {
    return (
      <Shell>
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Your Commitments</h1>
          <p className="text-sm text-muted-foreground">What will you commit to after this session?</p>
        </div>
        <div className="space-y-3">
          {myCommitments.map((c, i) => (
            <Textarea
              key={i}
              placeholder={`Commitment ${i + 1}`}
              value={c}
              onChange={(e) => updateCommitment(i, e.target.value)}
              className="min-h-[60px] resize-none"
            />
          ))}
          {myCommitments.length < 3 && (
            <Button variant="ghost" size="sm" onClick={() => setMyCommitments([...myCommitments, ""])}>
              + Add another
            </Button>
          )}
        </div>
        <Button variant="warm" size="lg" className="w-full" onClick={finishCommitments}>
          Save Commitments <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </Shell>
    );
  }

  // done
  return (
    <Shell>
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl endo-gradient">
          <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">Demo Complete 🎉</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You've walked through the entire session flow. Download the PDF to see how reflections are delivered to couples.
        </p>
      </div>
      <Button variant="warm" size="lg" className="w-full" onClick={downloadPdf}>
        <Download className="h-4 w-4 mr-1" /> Download Session PDF
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => { setPhase("start"); setQIndex(0); setMyAnswers(Array(total).fill("")); setCurrentAnswer(""); setMyCommitments([""]); }}>
        Restart Demo
      </Button>
    </Shell>
  );
}
