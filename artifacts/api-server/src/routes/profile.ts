import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  db,
  topicsTable,
  assignmentsTable,
  problemsTable,
} from "@workspace/db";
import {
  GetProfileTopicsResponseItem,
  GenerateAssignmentReadinessBody,
  GenerateAssignmentReadinessResponse,
} from "@workspace/api-zod";
import { chatJson } from "../lib/ai";
import { getUserId } from "../lib/userId";
import {
  getTopicStats,
  masteryFor,
  practiceCountForUser,
} from "../lib/profile";

const router: IRouter = Router();

type StatOut = {
  topicId: number;
  topicTitle: string;
  weekNumber: number;
  attempts: number;
  accuracy: number;
  avgScore: number;
  masteryLabel:
    | "mastered"
    | "strong"
    | "developing"
    | "shaky"
    | "weak"
    | "untested";
  lastPracticedAt: string | null;
};

async function buildTopicStats(userId: string): Promise<StatOut[]> {
  const topics = await db
    .select()
    .from(topicsTable)
    .orderBy(asc(topicsTable.weekNumber), asc(topicsTable.id));
  const stats = await getTopicStats(userId);
  return topics.map((t) => {
    const s = stats.get(t.id);
    const attempts = s?.attempts ?? 0;
    const accuracy = attempts > 0 ? (s!.correctCount / attempts) : 0;
    const avgScore = attempts > 0 ? s!.sumScore / attempts : 0;
    return {
      topicId: t.id,
      topicTitle: t.title,
      weekNumber: t.weekNumber,
      attempts,
      accuracy,
      avgScore,
      masteryLabel: masteryFor(attempts, accuracy),
      lastPracticedAt: s?.lastPracticedAt ? s.lastPracticedAt.toISOString() : null,
    };
  });
}

// GET /profile/topics
router.get("/profile/topics", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const out = await buildTopicStats(userId);
  res.json(out.map((s) => GetProfileTopicsResponseItem.parse(s)));
});

// POST /profile/assignment-readiness — surgical, analytics-grounded pointers.
router.post("/profile/assignment-readiness", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = GenerateAssignmentReadinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { assignmentId } = parsed.data;

  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, assignmentId));
  if (!assignment) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }

  // The topics this assignment actually covers.
  const coveredTopicIds = await db
    .select({ topicId: problemsTable.topicId })
    .from(problemsTable)
    .where(eq(problemsTable.assignmentId, assignmentId));
  const topicIdSet = new Set(coveredTopicIds.map((r) => r.topicId));

  const allStats = await buildTopicStats(userId);
  const relevant = allStats.filter((s) => topicIdSet.has(s.topicId));
  const practiceCount = await practiceCountForUser(userId);

  // Readiness score: average of per-topic readiness, where each topic's
  // readiness is accuracy scaled by an evidence factor (few attempts => less
  // confidence => capped contribution). Untested topics drag the score down.
  let sum = 0;
  for (const s of relevant) {
    const evidence = Math.min(1, s.attempts / 3); // full weight after 3 attempts
    const topicReadiness = s.attempts === 0 ? 0 : s.accuracy * (0.5 + 0.5 * evidence);
    sum += topicReadiness;
  }
  const readinessScore = relevant.length === 0 ? 0 : Math.round((sum / relevant.length) * 100);

  const readinessLabel: "ready" | "almost" | "keep_practicing" | "not_ready" =
    readinessScore >= 80
      ? "ready"
      : readinessScore >= 60
      ? "almost"
      : readinessScore >= 35
      ? "keep_practicing"
      : "not_ready";

  // Deterministic pointers grounded in the real numbers (sorted weakest first).
  const sorted = [...relevant].sort((a, b) => {
    const ra = a.attempts === 0 ? -1 : a.accuracy;
    const rb = b.attempts === 0 ? -1 : b.accuracy;
    return ra - rb;
  });
  const pointers = sorted.map((s) => {
    let severity: "focus" | "review" | "solid";
    let text: string;
    if (s.attempts === 0) {
      severity = "focus";
      text = `You haven't practiced "${s.topicTitle}" yet — generate a practice set covering it before the graded version.`;
    } else if (s.accuracy < 0.55) {
      severity = "focus";
      text = `"${s.topicTitle}": ${Math.round(s.accuracy * 100)}% correct over ${s.attempts} attempt${s.attempts === 1 ? "" : "s"}. This is your weakest covered topic — drill it next.`;
    } else if (s.accuracy < 0.8) {
      severity = "review";
      text = `"${s.topicTitle}": ${Math.round(s.accuracy * 100)}% correct over ${s.attempts} attempt${s.attempts === 1 ? "" : "s"}. Close — a couple more practice problems should lock it in.`;
    } else {
      severity = "solid";
      text = `"${s.topicTitle}": ${Math.round(s.accuracy * 100)}% correct over ${s.attempts} attempt${s.attempts === 1 ? "" : "s"}. Solid — keep it warm.`;
    }
    return { topicId: s.topicId, topicTitle: s.topicTitle, severity, text };
  });

  // A short AI headline grounded in the same numbers.
  let headline = "";
  try {
    const out = await chatJson<{ headline: string }>(
      "You are a precise precalculus study coach. Given a student's readiness score and per-topic accuracy for a precalculus assignment, write ONE punchy sentence (no more) telling them exactly which mathematical topic to practice next. Respond as strict JSON: {\"headline\": string}.",
      JSON.stringify({
        assignment: assignment.title,
        readinessScore,
        practiceCount,
        topics: relevant.map((s) => ({
          topic: s.topicTitle,
          attempts: s.attempts,
          accuracyPct: Math.round(s.accuracy * 100),
        })),
      }),
    );
    headline = out.headline || "";
  } catch {
    headline = "";
  }
  if (!headline) {
    const weakest = sorted[0];
    headline = weakest
      ? weakest.attempts === 0
        ? `Start with "${weakest.topicTitle}" — you haven't practiced it yet.`
        : `Focus your next practice session on "${weakest.topicTitle}".`
      : "Generate a practice set to start building your readiness profile.";
  }

  res.json(
    GenerateAssignmentReadinessResponse.parse({
      assignmentId,
      assignmentTitle: assignment.title,
      readinessScore,
      readinessLabel,
      headline,
      practiceCount,
      pointers,
      topics: relevant,
    }),
  );
});

export default router;
