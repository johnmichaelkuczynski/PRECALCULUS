import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, lecturesTable } from "@workspace/db";
import { AskTutorBody, AskTutorResponse } from "@workspace/api-zod";
import { chatText, chatJson, FAST_MODEL } from "../lib/ai";

const router: IRouter = Router();

router.get("/tutor/suggestions/:lectureId", async (req, res): Promise<void> => {
  const lectureId = Number(req.params.lectureId);
  if (!Number.isFinite(lectureId)) {
    res.status(400).json({ error: "invalid lectureId" });
    return;
  }
  const [lecture] = await db
    .select()
    .from(lecturesTable)
    .where(eq(lecturesTable.id, lectureId));
  if (!lecture) {
    res.status(404).json({ error: "lecture not found" });
    return;
  }

  try {
    const out = await chatJson<{ questions: string[] }>(
      'You are an encouraging college precalculus tutor. Reply as strict JSON of the form {"questions": string[]} with NO other keys.',
      `From the lecture below, generate 6 short, concrete starter questions a student might want to ask after reading it. Cover every major idea in the reading (not just the first one). Each question must be one sentence, under ~18 words, in the student's voice (e.g. "Why does ...?", "Can you show me ...?", "What's the difference between ...?").\n\nMATH NOTATION RULES (strict):\n- ANY math symbol, variable, formula, or expression — including simple ones like $E$, $mc^2$, $\\pi$, $x^2$, $\\Delta S \\ge 0$ — MUST be wrapped in $...$ (LaTeX inline math).\n- NEVER write raw exponents like mc^2, x^2, or H_2O. ALWAYS wrap: $mc^2$, $x^2$, $H_2O$.\n- Greek letters and special symbols (\\pi, \\sigma, \\Delta, \\equiv, \\approx, \\sum, \\int, \\to, \\forall, \\in, \\mathbb{R}, ...) MUST be inside $...$.\n- Plain English words ("identity", "limit", "set") stay outside the math delimiters.\n\nLECTURE TITLE: ${lecture.title}\n\nLECTURE BODY:\n"""\n${lecture.body}\n"""`,
      FAST_MODEL,
    );
    const questions = Array.isArray(out?.questions)
      ? out.questions.filter((q) => typeof q === "string" && q.trim().length > 0).slice(0, 8)
      : [];
    res.json({ questions });
  } catch {
    res.json({ questions: [] });
  }
});

router.post("/tutor/ask", async (req, res): Promise<void> => {
  const parsed = AskTutorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, selectedLectureText } = parsed.data;

  const sys =
    "You are an encouraging college precalculus tutor. Explain step by step using functions, graphs, algebra, trigonometry, and concrete worked mathematical examples; write inline math as $...$ (LaTeX). Keep replies short (3-6 sentences) unless the student asks for more detail. By default, guide rather than hand over the answer — BUT if the student explicitly asks you to 'just give the answer', 'show me the answer', 'tell me the answer', or otherwise asks for a direct answer, then give the complete, correct answer plainly without Socratic dodging.";
  const user = selectedLectureText
    ? `Context from the lecture the student is reading:\n"""\n${selectedLectureText}\n"""\n\nStudent question: ${message}`
    : message;

  let text = "";
  try {
    text = await chatText(sys, user);
  } catch {
    text =
      "I'm having trouble reaching the tutor service right now. Try again in a moment, and consider re-reading the relevant section of the lecture.";
  }
  res.json(AskTutorResponse.parse({ text, audioUrl: null }));
});

export default router;
