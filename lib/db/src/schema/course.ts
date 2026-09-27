import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const topicsTable = pgTable("topics", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  weekNumber: integer("week_number").notNull(),
  blurb: text("blurb"),
  position: integer("position").notNull().default(0),
});

export const lecturesTable = pgTable("lectures", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topicsTable.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  bodyMedium: text("body_medium"),
  bodyLong: text("body_long"),
});

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // homework | test | midterm | final
  title: text("title").notNull(),
  weekNumber: integer("week_number").notNull(),
  position: integer("position").notNull().default(0),
  isTimed: boolean("is_timed").notNull().default(false),
  timeLimitMinutes: integer("time_limit_minutes"),
  instructions: text("instructions"),
});

export const problemsTable = pgTable("problems", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topicsTable.id),
  position: integer("position").notNull(),
  prompt: text("prompt").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  hint: text("hint"),
});

export const attemptsTable = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  assignmentId: integer("assignment_id")
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("in_progress"), // in_progress | submitted
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  scorePercent: doublePrecision("score_percent"),
});

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id")
    .notNull()
    .references(() => attemptsTable.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problemsTable.id, { onDelete: "cascade" }),
  answer: text("answer").notNull().default(""),
  correct: boolean("correct"),
  keystrokeCount: integer("keystroke_count").notNull().default(0),
  eraseCount: integer("erase_count").notNull().default(0),
  bulkInsertCount: integer("bulk_insert_count").notNull().default(0),
  longestBulkInsertChars: integer("longest_bulk_insert_chars").notNull().default(0),
  rewriteSegments: integer("rewrite_segments").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  aiScore: doublePrecision("ai_score"),
  aiFlagged: boolean("ai_flagged"),
  diachronicScore: doublePrecision("diachronic_score"),
  diachronicFlagged: boolean("diachronic_flagged"),
  detectionRationale: text("detection_rationale"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practiceSessionsTable = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  weekNumber: integer("week_number"),
  topicId: integer("topic_id"),
  tutorEnabled: boolean("tutor_enabled").notNull().default(false),
  focusOnWeaknesses: boolean("focus_on_weaknesses").notNull().default(true),
  difficulty: doublePrecision("difficulty").notNull().default(2.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practiceProblemsTable = pgTable("practice_problems", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => practiceSessionsTable.id, { onDelete: "cascade" }),
  topicId: integer("topic_id").notNull(),
  prompt: text("prompt").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: doublePrecision("difficulty").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practiceAttemptsTable = pgTable("practice_attempts", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  sessionId: integer("session_id")
    .notNull()
    .references(() => practiceSessionsTable.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => practiceProblemsTable.id, { onDelete: "cascade" }),
  topicId: integer("topic_id").notNull(),
  answer: text("answer").notNull(),
  correct: boolean("correct").notNull(),
  difficulty: doublePrecision("difficulty").notNull(),
  trace: jsonb("trace"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Practice assignments: full, unlimited, per-user practice versions of each
// graded assignment. Freshly generated; never reuse the real graded problems.
// ─────────────────────────────────────────────────────────────────────────────
export const practiceAssignmentsTable = pgTable("practice_assignments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sourceAssignmentId: integer("source_assignment_id")
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // homework | test | midterm | final
  title: text("title").notNull(),
  weekNumber: integer("week_number").notNull(),
  difficulty: doublePrecision("difficulty").notNull().default(3.0),
  status: text("status").notNull().default("in_progress"), // in_progress | submitted
  scorePercent: doublePrecision("score_percent"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

export const practiceAssignmentProblemsTable = pgTable("practice_assignment_problems", {
  id: serial("id").primaryKey(),
  practiceAssignmentId: integer("practice_assignment_id")
    .notNull()
    .references(() => practiceAssignmentsTable.id, { onDelete: "cascade" }),
  topicId: integer("topic_id").notNull(),
  position: integer("position").notNull(),
  prompt: text("prompt").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  hint: text("hint"),
  difficulty: doublePrecision("difficulty").notNull().default(3.0),
});

export const practiceAssignmentAnswersTable = pgTable("practice_assignment_answers", {
  id: serial("id").primaryKey(),
  practiceAssignmentId: integer("practice_assignment_id")
    .notNull()
    .references(() => practiceAssignmentsTable.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => practiceAssignmentProblemsTable.id, { onDelete: "cascade" }),
  answer: text("answer").notNull().default(""),
  correct: boolean("correct"),
  score: doublePrecision("score"), // 0..1 partial credit
  feedback: text("feedback"), // rich markdown feedback
  whatWasRight: text("what_was_right"),
  whatToFix: text("what_to_fix"),
  conceptTip: text("concept_tip"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
});

// Dialogue threads about practice feedback (per problem, or whole assignment).
export const feedbackMessagesTable = pgTable("feedback_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  practiceAssignmentId: integer("practice_assignment_id")
    .notNull()
    .references(() => practiceAssignmentsTable.id, { onDelete: "cascade" }),
  problemId: integer("problem_id"), // null => about the whole assignment
  role: text("role").notNull(), // user | tutor
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Evolving per-user, per-topic mastery profile. Upserted after every activity.
export const userTopicStatsTable = pgTable(
  "user_topic_stats",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    topicId: integer("topic_id").notNull(),
    attempts: integer("attempts").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    sumScore: doublePrecision("sum_score").notNull().default(0),
    lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userTopicUnique: uniqueIndex("user_topic_stats_user_topic_uq").on(
      t.userId,
      t.topicId,
    ),
  }),
);

// Append-only log of every user activity (drives the evolving profile).
export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(), // practice_generated | practice_submitted | practice_problem_graded | feedback_dialogue | graded_submitted
  refId: integer("ref_id"),
  topicId: integer("topic_id"),
  score: doublePrecision("score"),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
