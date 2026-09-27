import { eq, sql } from "drizzle-orm";
import { db, userTopicStatsTable, activityLogTable } from "@workspace/db";

// Records a single graded result into the user's evolving per-topic profile.
// Upserts on (userId, topicId): bumps attempt count, correct count, and the
// running score sum so accuracy and average score can be derived on read.
export async function recordTopicResult(opts: {
  userId: string;
  topicId: number;
  correct: boolean;
  score: number; // 0..1
}): Promise<void> {
  const { userId, topicId, correct, score } = opts;
  await db
    .insert(userTopicStatsTable)
    .values({
      userId,
      topicId,
      attempts: 1,
      correctCount: correct ? 1 : 0,
      sumScore: score,
      lastPracticedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [userTopicStatsTable.userId, userTopicStatsTable.topicId],
      set: {
        attempts: sql`${userTopicStatsTable.attempts} + 1`,
        correctCount: sql`${userTopicStatsTable.correctCount} + ${correct ? 1 : 0}`,
        sumScore: sql`${userTopicStatsTable.sumScore} + ${score}`,
        lastPracticedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

// Appends an entry to the user's activity log.
export async function logActivity(opts: {
  userId: string;
  kind: string;
  refId?: number | null;
  topicId?: number | null;
  score?: number | null;
  detail?: string | null;
}): Promise<void> {
  await db.insert(activityLogTable).values({
    userId: opts.userId,
    kind: opts.kind,
    refId: opts.refId ?? null,
    topicId: opts.topicId ?? null,
    score: opts.score ?? null,
    detail: opts.detail ?? null,
  });
}

export type TopicStatRow = {
  topicId: number;
  attempts: number;
  correctCount: number;
  sumScore: number;
  lastPracticedAt: Date | null;
};

export async function getTopicStats(userId: string): Promise<Map<number, TopicStatRow>> {
  const rows = await db
    .select()
    .from(userTopicStatsTable)
    .where(eq(userTopicStatsTable.userId, userId));
  const map = new Map<number, TopicStatRow>();
  for (const r of rows) {
    map.set(r.topicId, {
      topicId: r.topicId,
      attempts: r.attempts,
      correctCount: r.correctCount,
      sumScore: r.sumScore,
      lastPracticedAt: r.lastPracticedAt,
    });
  }
  return map;
}

export type MasteryLabel =
  | "mastered"
  | "strong"
  | "developing"
  | "shaky"
  | "weak"
  | "untested";

export function masteryFor(attempts: number, accuracy: number): MasteryLabel {
  if (attempts === 0) return "untested";
  if (accuracy >= 0.9) return "mastered";
  if (accuracy >= 0.75) return "strong";
  if (accuracy >= 0.55) return "developing";
  if (accuracy >= 0.35) return "shaky";
  return "weak";
}

// Counts how many practice attempts a user has logged on a topic (used to
// avoid penalizing a brand-new topic too harshly in readiness scoring).
export async function practiceCountForUser(userId: string): Promise<number> {
  const r = await db.execute(
    sql`select count(*)::int as n from practice_assignments where user_id = ${userId} and status = 'submitted'`,
  );
  return Number((r.rows[0] as { n?: number } | undefined)?.n ?? 0);
}

export async function topicAttemptsForAssignment(
  userId: string,
  topicIds: number[],
): Promise<Map<number, TopicStatRow>> {
  if (topicIds.length === 0) return new Map();
  const all = await getTopicStats(userId);
  const filtered = new Map<number, TopicStatRow>();
  for (const id of topicIds) {
    const row = all.get(id);
    if (row) filtered.set(id, row);
  }
  return filtered;
}
