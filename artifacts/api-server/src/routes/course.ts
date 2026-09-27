import { Router, type IRouter } from "express";
import { eq, and, asc, sql } from "drizzle-orm";
import {
  db,
  topicsTable,
  lecturesTable,
  assignmentsTable,
  attemptsTable,
  problemsTable,
} from "@workspace/db";
import { inArray } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { getUserId } from "../lib/userId";
import {
  GetCourseOverviewResponse,
  GetWeekResponse,
  GetLectureResponse,
  ListTopicsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WEEK_TITLES: Record<number, { title: string; summary: string }> = {
  1: {
    title: "Functions and their graphs",
    summary:
      "Real numbers and intervals; functions and notation; graphs; transformations; composition; inverses; linear functions and rates of change.",
  },
  2: {
    title: "Polynomial and rational functions",
    summary:
      "Quadratics; polynomial graphs and division; zeros; complex numbers; rational functions; polynomial and rational inequalities.",
  },
  3: {
    title: "Exponentials, logarithms, and trigonometry",
    summary:
      "Exponential and logarithmic functions; growth and decay; angles and radians; the unit circle; graphs of sine and cosine.",
  },
  4: {
    title: "Trigonometry and the road to calculus",
    summary:
      "Trigonometric identities and equations; triangle laws; polar coordinates; conics; vectors; sequences and series; capstone synthesis.",
  },
};

async function buildWeek(weekNumber: number, userId: string) {
  const lectures = await db
    .select({
      id: lecturesTable.id,
      title: lecturesTable.title,
      topicId: lecturesTable.topicId,
    })
    .from(lecturesTable)
    .where(eq(lecturesTable.weekNumber, weekNumber))
    .orderBy(asc(lecturesTable.id));

  const assignments = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.weekNumber, weekNumber))
    .orderBy(asc(assignmentsTable.position));

  const assignmentSummaries = await Promise.all(
    assignments.map(async (a) => {
      const counts = await db.execute(
        sql`select count(*)::int as n from problems where assignment_id = ${a.id}`,
      );
      const n = (counts.rows[0] as { n?: number } | undefined)?.n ?? 0;
      const attempts = await db
        .select()
        .from(attemptsTable)
        .where(
          and(
            eq(attemptsTable.assignmentId, a.id),
            eq(attemptsTable.userId, userId),
          ),
        )
        .orderBy(asc(attemptsTable.id));
      const submitted = attempts.filter((x) => x.status === "submitted");
      const inProgress = attempts.find((x) => x.status === "in_progress");
      const best = submitted.reduce(
        (best, x) =>
          x.scorePercent != null && x.scorePercent > best ? x.scorePercent : best,
        -1,
      );
      const status: "not_started" | "in_progress" | "submitted" = inProgress
        ? "in_progress"
        : submitted.length > 0
        ? "submitted"
        : "not_started";
      const last = attempts[attempts.length - 1];
      return {
        id: a.id,
        kind: a.kind as "homework" | "test" | "midterm" | "final",
        title: a.title,
        weekNumber: a.weekNumber,
        problemCount: n,
        isTimed: a.isTimed,
        timeLimitMinutes: a.timeLimitMinutes,
        status,
        bestScore: best < 0 ? null : best,
        lastAttemptId: last?.id ?? null,
      };
    }),
  );

  const meta = WEEK_TITLES[weekNumber] ?? {
    title: `Week ${weekNumber}`,
    summary: "",
  };

  return {
    weekNumber,
    title: meta.title,
    summary: meta.summary,
    lectures,
    assignments: assignmentSummaries,
  };
}

router.get("/course/overview", async (req, res) => {
  const userId = getUserId(req);
  const weeks = await Promise.all([1, 2, 3, 4].map((w) => buildWeek(w, userId)));
  const assignmentsTotal = weeks.reduce((s, w) => s + w.assignments.length, 0);
  const assignmentsCompleted = weeks.reduce(
    (s, w) => s + w.assignments.filter((a) => a.status === "submitted").length,
    0,
  );
  const practiceCountRow = await db.execute(
    sql`select count(*)::int as n from practice_attempts where user_id = ${userId}`,
  );
  const practiceCount =
    (practiceCountRow.rows[0] as { n?: number } | undefined)?.n ?? 0;

  res.json(
    GetCourseOverviewResponse.parse({
      title: "Precalculus",
      weeks,
      totals: { assignmentsCompleted, assignmentsTotal, practiceCount },
    }),
  );
});

router.get("/course/weeks/:weekNumber", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.weekNumber)
    ? req.params.weekNumber[0]
    : req.params.weekNumber;
  const weekNumber = parseInt(raw ?? "", 10);
  if (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 4) {
    res.status(400).json({ error: "invalid weekNumber" });
    return;
  }
  const week = await buildWeek(weekNumber, getUserId(req));
  res.json(GetWeekResponse.parse(week));
});

router.get("/course/lectures/:lectureId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.lectureId)
    ? req.params.lectureId[0]
    : req.params.lectureId;
  const lectureId = parseInt(raw ?? "", 10);
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
  res.json(GetLectureResponse.parse(lecture));
});

router.get("/course/topics", async (_req, res) => {
  const rows = await db
    .select()
    .from(topicsTable)
    .orderBy(asc(topicsTable.position));
  res.json(ListTopicsResponse.parse(rows));
});

// ─────────────────────────────────────────────────────────────────────────────
// Course download: every precalculus lecture (short version) plus practice work
// and exams, as PDF or TXT. Public — no login required.
// ─────────────────────────────────────────────────────────────────────────────

type DownloadSection = {
  heading: string;
  sub?: string;
  paragraphs: string[];
};

async function buildCourseDocument(): Promise<{
  title: string;
  sections: DownloadSection[];
}> {
  const topics = await db
    .select()
    .from(topicsTable)
    .orderBy(asc(topicsTable.position));
  const lectures = await db.select().from(lecturesTable);
  const lectureByTopic = new Map(lectures.map((l) => [l.topicId, l]));

  const sections: DownloadSection[] = [];

  for (let week = 1; week <= 4; week++) {
    const wt = WEEK_TITLES[week];
    if (wt) {
      sections.push({ heading: wt.title, paragraphs: [wt.summary] });
    }
    for (const t of topics.filter((t) => t.weekNumber === week)) {
      const lecture = lectureByTopic.get(t.id);
      if (!lecture) continue;
      sections.push({
        heading: lecture.title,
        sub: t.blurb ?? undefined,
        paragraphs: lecture.body
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter(Boolean),
      });
    }
  }

  // Sample assignments: two homeworks, the midterm, and the final.
  const allAssignments = await db
    .select()
    .from(assignmentsTable)
    .orderBy(asc(assignmentsTable.weekNumber), asc(assignmentsTable.position));
  const homeworks = allAssignments.filter((a) => a.kind === "homework").slice(0, 2);
  const exams = allAssignments.filter(
    (a) => a.kind === "midterm" || a.kind === "final",
  );
  const chosen = [...homeworks, ...exams];

  if (chosen.length > 0) {
    const problems = await db
      .select()
      .from(problemsTable)
      .where(
        inArray(
          problemsTable.assignmentId,
          chosen.map((a) => a.id),
        ),
      )
      .orderBy(asc(problemsTable.position));

    sections.push({
      heading: "Practice problems",
      paragraphs: [
        "A sample of the graded work in the course: two homeworks plus the midterm and final. Answers follow at the end.",
      ],
    });

    const answerKey: string[] = [];
    for (const a of chosen) {
      const ps = problems.filter((p) => p.assignmentId === a.id);
      sections.push({
        heading: a.title,
        sub: a.instructions ?? undefined,
        paragraphs: ps.map((p, i) => `${i + 1}. ${p.prompt}`),
      });
      answerKey.push(
        `${a.title}:`,
        ...ps.map((p, i) => `  ${i + 1}. ${p.correctAnswer}`),
      );
    }
    sections.push({ heading: "Answer key", paragraphs: answerKey });
  }

  return { title: "Precalculus — A Four-Week Course", sections };
}

router.get("/course/download", async (req, res) => {
  const format = req.query.format === "txt" ? "txt" : "pdf";
  const doc = await buildCourseDocument();

  if (format === "txt") {
    const lines: string[] = [doc.title, "=".repeat(doc.title.length), ""];
    for (const s of doc.sections) {
      lines.push(s.heading, "-".repeat(Math.min(s.heading.length, 72)));
      if (s.sub) lines.push(s.sub);
      lines.push("", ...s.paragraphs.flatMap((p) => [p, ""]));
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
       'attachment; filename="precalculus-course.txt"',
    );
    res.send(lines.join("\n"));
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
     'attachment; filename="precalculus-course.pdf"',
  );
  const pdf = new PDFDocument({ size: "LETTER", margin: 54 });
  pdf.pipe(res);
  pdf.font("Times-Bold").fontSize(22).text(doc.title);
  pdf.moveDown(0.5);
  pdf
    .font("Times-Roman")
    .fontSize(11)
    .fillColor("#555555")
    .text(
       "Every precalculus lecture (short version) plus sample homework and exam problems with an answer key.",
    );
  pdf.fillColor("#000000");
  for (const s of doc.sections) {
    pdf.moveDown(1);
    pdf.font("Times-Bold").fontSize(14).text(s.heading);
    if (s.sub) {
      pdf.font("Times-Italic").fontSize(10.5).fillColor("#444444").text(s.sub);
      pdf.fillColor("#000000");
    }
    pdf.moveDown(0.25);
    for (const p of s.paragraphs) {
      pdf.font("Times-Roman").fontSize(11).text(p, { paragraphGap: 6 });
    }
  }
  pdf.end();
});

export default router;
