import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export async function downloadSessionPdf(params: {
  sessionId: string;
  userId: string;
  myName: string;
  partnerName: string;
}) {
  const { sessionId, userId, myName, partnerName } = params;

  // Fetch session info
  const { data: session } = await supabase
    .from("sessions")
    .select("session_number, completed_at, created_at")
    .eq("id", sessionId)
    .single();

  // Fetch questions
  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, order_index")
    .eq("session_id", sessionId)
    .order("order_index");

  if (!questions || questions.length === 0) {
    throw new Error("No questions found for this session");
  }

  // Fetch all answers
  const questionIds = questions.map((q) => q.id);
  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, user_id, answer_text")
    .in("question_id", questionIds);

  // Fetch commitments
  const { data: commitments } = await supabase
    .from("commitments")
    .select("user_id, commitment_text")
    .eq("session_id", sessionId);

  // Build PDF
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

  // Header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageWidth, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("EndoPartner", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Session ${session?.session_number ?? ""} — Reflections`, margin, 60);
  y = 110;

  const dateStr = new Date(session?.completed_at || session?.created_at || Date.now()).toLocaleDateString();
  writeWrapped(`Date: ${dateStr}`, 10, { color: [110, 110, 110] });
  writeWrapped(`Between: ${myName} & ${partnerName}`, 10, { color: [110, 110, 110] });
  y += 8;

  // Q&A
  questions.forEach((q, i) => {
    y += 12;
    ensureSpace(60);
    writeWrapped(`Question ${i + 1}`, 10, { bold: true, color: [124, 58, 237] });
    writeWrapped(q.question_text, 13, { bold: true });
    y += 6;

    const myA = answers?.find((a) => a.question_id === q.id && a.user_id === userId);
    const theirA = answers?.find((a) => a.question_id === q.id && a.user_id !== userId);

    writeWrapped(`${myName}:`, 10, { bold: true, color: [80, 80, 80] });
    writeWrapped(myA?.answer_text || "— No answer —", 11);
    y += 4;
    writeWrapped(`${partnerName}:`, 10, { bold: true, color: [80, 80, 80] });
    writeWrapped(theirA?.answer_text || "— No answer —", 11);

    // Separator
    y += 8;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  });

  // Commitments
  if (commitments && commitments.length > 0) {
    y += 12;
    ensureSpace(40);
    writeWrapped("Commitments", 16, { bold: true, color: [124, 58, 237] });
    y += 4;

    const mine = commitments.filter((c) => c.user_id === userId);
    const theirs = commitments.filter((c) => c.user_id !== userId);

    if (mine.length) {
      writeWrapped(`${myName}:`, 11, { bold: true });
      mine.forEach((c) => writeWrapped(`• ${c.commitment_text}`, 11));
      y += 4;
    }
    if (theirs.length) {
      writeWrapped(`${partnerName}:`, 11, { bold: true });
      theirs.forEach((c) => writeWrapped(`• ${c.commitment_text}`, 11));
    }
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `EndoPartner • Page ${p} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" }
    );
  }

  doc.save(`endopartner-session-${session?.session_number ?? ""}.pdf`);
}
