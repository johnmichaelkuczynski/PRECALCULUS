import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetPracticeAssignment,
  useSavePracticeAssignmentAnswer,
  useSubmitPracticeAssignment,
  useGetFeedbackMessages,
  usePostFeedbackMessage,
  useAskTutor,
  type PracticeAssignmentResult,
  type KeystrokeTrace,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AnswerInput } from "@/components/AnswerInput";
import { MathChatInput } from "@/components/MathChatInput";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  GraduationCap,
} from "lucide-react";

type ChatMsg = { role: "user" | "tutor"; text: string };

export default function PracticeAssignmentRunner() {
  const params = useParams();
  const practiceId = Number(params.id);

  const { data: pa, isLoading, refetch } = useGetPracticeAssignment(practiceId);
  const saveAnswer = useSavePracticeAssignmentAnswer();
  const submit = useSubmitPracticeAssignment();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [result, setResult] = useState<PracticeAssignmentResult | null>(null);

  // Seed local answers from the server once.
  const seededRef = useRef(false);
  useEffect(() => {
    if (pa && !seededRef.current) {
      const init: Record<number, string> = {};
      pa.answers.forEach((a) => {
        init[a.problemId] = a.answer;
      });
      setAnswers(init);
      seededRef.current = true;
      if (pa.status === "submitted") {
        // Reconstruct a result view from the persisted answers.
        const total = pa.problems.length;
        const score = pa.answers.filter((a) => a.correct).length;
        setResult({
          id: pa.id,
          score,
          total,
          percent: pa.scorePercent ?? (total ? (score / total) * 100 : 0),
          overallFeedback: null,
          perProblem: pa.problems.map((p) => {
            const a = pa.answers.find((x) => x.problemId === p.id);
            return {
              problemId: p.id,
              correct: a?.correct ?? false,
              score: a?.score ?? 0,
              userAnswer: a?.answer ?? "",
              correctAnswer: a?.correctAnswer ?? "",
              explanation: a?.explanation ?? "",
              feedback: a?.feedback ?? "",
              whatWasRight: a?.whatWasRight ?? null,
              whatToFix: a?.whatToFix ?? null,
              conceptTip: a?.conceptTip ?? null,
              topicId: p.topicId,
              topicTitle: p.topicTitle ?? null,
            };
          }),
        });
      }
    }
  }, [pa]);

  function handleChange(problemId: number, val: string, _trace: KeystrokeTrace) {
    setAnswers((prev) => ({ ...prev, [problemId]: val }));
    saveAnswer.mutate({ id: practiceId, data: { problemId, answer: val } });
  }

  function handleSubmit() {
    submit.mutate(
      { id: practiceId },
      {
        onSuccess: (data) => {
          setResult(data);
          void refetch();
        },
      },
    );
  }

  if (isLoading || !pa) {
    return (
      <Layout>
        <div className="p-8 max-w-3xl mx-auto w-full flex flex-col gap-6">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const problems = pa.problems;
  const current = problems[currentIdx];

  return (
    <Layout>
      <div className="px-6 pt-4 pb-2 flex items-center justify-between">
        <Link href={`/assignments/${pa.sourceAssignmentId}`}>
          <Button variant="ghost" className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to the graded assignment
          </Button>
        </Link>
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-chart-4/15 text-chart-4 border border-chart-4/30">
          <Sparkles className="w-3.5 h-3.5" />
          Practice mode · tutor on · not graded
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-0">
        {/* LEFT: problems / results */}
        <div className="overflow-y-auto px-8 pb-16 border-r border-border">
          <header className="mb-6 mt-2">
            <h1 className="text-2xl font-serif font-bold text-primary leading-tight">
              {pa.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Week {pa.weekNumber} · {pa.kind} · {problems.length} problems
            </p>
            {pa.instructions && (
              <div className="mt-3 text-sm text-muted-foreground">
                <MarkdownRenderer content={pa.instructions} />
              </div>
            )}
          </header>

          {result ? (
            <ResultsView result={result} />
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>
                  Problem {currentIdx + 1} of {problems.length}
                </span>
                {current?.topicTitle && (
                  <span className="normal-case font-normal">{current.topicTitle}</span>
                )}
              </div>

              {current ? (
                <>
                  <div className="bg-card border shadow-sm rounded-lg p-6 text-lg leading-relaxed">
                    <MarkdownRenderer content={current.prompt} />
                    {current.hint && (
                      <div className="mt-4 pt-3 border-t border-dashed text-sm text-muted-foreground inline-flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-chart-4" />
                        <span><strong>Hint:</strong> {current.hint}</span>
                      </div>
                    )}
                  </div>

                  <AnswerInput
                    value={answers[current.id] || ""}
                    onChange={(val, trace) => handleChange(current.id, val, trace)}
                    promptSource={current.prompt}
                  />

                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                      disabled={currentIdx === 0}
                    >
                      Previous
                    </Button>
                    {currentIdx < problems.length - 1 ? (
                      <Button onClick={() => setCurrentIdx((p) => p + 1)}>Next</Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={submit.isPending}
                        className="bg-chart-2 hover:bg-chart-2/90 text-white"
                      >
                        {submit.isPending ? "Grading…" : "Submit for feedback"}
                      </Button>
                    )}
                  </div>

                  {/* quick jump */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {problems.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => setCurrentIdx(i)}
                        className={`w-8 h-8 rounded-md text-xs font-medium border transition-colors ${
                          i === currentIdx
                            ? "bg-primary text-primary-foreground border-primary"
                            : answers[p.id]
                              ? "bg-chart-2/15 border-chart-2/40 text-foreground"
                              : "bg-background border-border text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div>No problems found.</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: live tutor / dialogue */}
        <div className="flex flex-col min-h-0 bg-secondary/20">
          {result ? (
            <FeedbackDialoguePane practiceId={practiceId} problems={problems} />
          ) : (
            <LiveTutorPane
              practiceTitle={pa.title}
              currentPrompt={current?.prompt ?? ""}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ============ Results (rich per-problem feedback) ============ */
function ResultsView({ result }: { result: PracticeAssignmentResult }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          <div>
            <div className="text-2xl font-serif font-bold text-primary">
              {Math.round(result.percent)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {result.score} of {result.total} correct
            </div>
          </div>
        </div>
        {result.overallFeedback && (
          <div className="mt-4 pt-4 border-t text-sm">
            <MarkdownRenderer content={result.overallFeedback} />
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground italic">
          Ask the tutor on the right about any problem — it has your answer and the feedback in context.
        </p>
      </div>

      {result.perProblem.map((pr, idx) => (
        <div
          key={pr.problemId}
          className={`p-5 rounded-lg border ${
            pr.correct ? "border-chart-2/50 bg-chart-2/5" : "border-destructive/40 bg-destructive/5"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium inline-flex items-center gap-2">
              {pr.correct ? (
                <CheckCircle2 className="w-4 h-4 text-chart-2" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
              Problem {idx + 1}
            </h3>
            {pr.topicTitle && (
              <span className="text-xs text-muted-foreground">{pr.topicTitle}</span>
            )}
          </div>

          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your answer
            </span>
            <div className="font-mono mt-1 text-sm">{pr.userAnswer || "— (blank)"}</div>
          </div>

          {!pr.correct && pr.correctAnswer && (
            <div className="mb-3 text-primary">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Canonical answer
              </span>
              <div className="font-mono mt-1 text-sm">{pr.correctAnswer}</div>
            </div>
          )}

          {pr.feedback && (
            <div className="mb-3 text-sm">
              <MarkdownRenderer content={pr.feedback} />
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {pr.whatWasRight && (
              <FeedbackChip label="What worked" tone="good" text={pr.whatWasRight} />
            )}
            {pr.whatToFix && (
              <FeedbackChip label="What to fix" tone="warn" text={pr.whatToFix} />
            )}
            {pr.conceptTip && (
              <FeedbackChip label="Concept tip" tone="info" text={pr.conceptTip} />
            )}
          </div>

          {pr.explanation && (
            <details className="mt-3">
              <summary className="text-xs font-semibold text-muted-foreground cursor-pointer">
                Full explanation
              </summary>
              <div className="mt-2 text-sm">
                <MarkdownRenderer content={pr.explanation} />
              </div>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

function FeedbackChip({
  label,
  tone,
  text,
}: {
  label: string;
  tone: "good" | "warn" | "info";
  text: string;
}) {
  const cls =
    tone === "good"
      ? "border-chart-2/40 bg-chart-2/10"
      : tone === "warn"
        ? "border-destructive/40 bg-destructive/10"
        : "border-chart-4/40 bg-chart-4/10";
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm leading-snug">
        <MarkdownRenderer content={text} />
      </div>
    </div>
  );
}

/* ============ Live tutor while practicing ============ */
function LiveTutorPane({
  practiceTitle,
  currentPrompt,
}: {
  practiceTitle: string;
  currentPrompt: string;
}) {
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const ask = useAskTutor();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [history.length, ask.isPending]);

  function send(text: string) {
    const msg = text.trim();
    if (!msg) return;
    setHistory((h) => [...h, { role: "user", text: msg }]);
    ask.mutate(
      {
        data: {
          message: `${msg}\n\n(Context — I'm working on this practice problem: """${currentPrompt}""". Give me a hint or explanation, but do NOT just hand me the final answer unless I explicitly ask.)`,
        },
      },
      {
        onSuccess: (res) => setHistory((h) => [...h, { role: "tutor", text: res.text }]),
        onError: (e) =>
          setHistory((h) => [...h, { role: "tutor", text: `Tutor error: ${(e as Error).message}` }]),
      },
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2.5 text-sm font-medium">
        <MessageSquare className="w-4 h-4 text-primary" />
        Live tutor — ask while you practice
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {history.length === 0 && (
          <div className="m-auto text-center text-sm text-muted-foreground italic max-w-xs">
            Stuck on a problem? Ask for a hint, the relevant formula, or a worked example for{" "}
            <span className="font-medium not-italic">{practiceTitle}</span>. The tutor knows which
            problem you're on.
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`max-w-[92%] ${m.role === "user" ? "self-end" : "self-start"}`}>
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
              <MarkdownRenderer content={m.text} inverted={m.role === "user"} />
            </div>
          </div>
        ))}
        {ask.isPending && (
          <div className="self-start px-3 py-2 rounded-lg bg-card border border-border text-sm animate-pulse text-muted-foreground">
            Thinking…
          </div>
        )}
      </div>
      <div className="border-t border-border bg-background p-3">
        <MathChatInput
          value={input}
          onChange={setInput}
          onSend={() => {
            const v = input.trim();
            if (v) {
              setInput("");
              send(v);
            }
          }}
          placeholder="Ask the tutor for a hint…"
          pending={ask.isPending}
          rows={2}
          minHeightClass="min-h-[56px]"
        />
      </div>
    </div>
  );
}

/* ============ Dialogue about the feedback (after submit) ============ */
function FeedbackDialoguePane({
  practiceId,
  problems,
}: {
  practiceId: number;
  problems: Array<{ id: number; position: number; topicTitle?: string | null }>;
}) {
  const [scope, setScope] = useState<number | null>(null); // problemId or null = whole assignment
  const { data: messages, refetch } = useGetFeedbackMessages(practiceId);
  const post = usePostFeedbackMessage();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(
    () => (messages ?? []).filter((m) => (scope == null ? m.problemId == null : m.problemId === scope)),
    [messages, scope],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [visible.length, post.isPending]);

  function send() {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    post.mutate(
      { id: practiceId, data: { problemId: scope, message: msg } },
      { onSuccess: () => void refetch() },
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-border bg-background px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          Discuss your feedback
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ScopeButton active={scope == null} onClick={() => setScope(null)}>
            Whole set
          </ScopeButton>
          {problems.map((p, i) => (
            <ScopeButton key={p.id} active={scope === p.id} onClick={() => setScope(p.id)}>
              Q{i + 1}
            </ScopeButton>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {visible.length === 0 && (
          <div className="m-auto text-center text-sm text-muted-foreground italic max-w-xs">
            Ask a follow-up about{" "}
            {scope == null ? "your overall results" : `problem ${problems.findIndex((p) => p.id === scope) + 1}`}
            . For example: "why is my formula wrong?" or "show me the full derivation."
          </div>
        )}
        {visible.map((m) => (
          <div key={m.id} className={`max-w-[92%] ${m.role === "user" ? "self-end" : "self-start"}`}>
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              }`}
            >
              <MarkdownRenderer content={m.content} inverted={m.role === "user"} />
            </div>
          </div>
        ))}
        {post.isPending && (
          <div className="self-start px-3 py-2 rounded-lg bg-card border border-border text-sm animate-pulse text-muted-foreground">
            Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background p-3">
        <MathChatInput
          value={input}
          onChange={setInput}
          onSend={send}
          placeholder="Ask about this feedback…"
          pending={post.isPending}
          rows={2}
          minHeightClass="min-h-[56px]"
        />
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
