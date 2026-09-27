import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { CheckCircle2, XCircle, Loader2, PlayCircle, Activity } from "lucide-react";

type Step = {
  name: string;
  ok: boolean;
  ms: number;
  detail?: string;
  error?: string;
};
type RunResult = {
  ok: boolean;
  generatedAt: string;
  steps: Step[];
};

const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`.replace(
  /^\/api/,
  "/api",
);

function apiUrl(path: string): string {
  // The api-server is mounted at /api at the proxy level, not under the artifact path.
  return `/api${path}`;
}

function StepRow({ s }: { s: Step }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {s.ok ? (
        <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{s.name}</div>
        {s.detail && (
          <div className="text-xs text-muted-foreground mt-0.5 break-words">{s.detail}</div>
        )}
        {s.error && (
          <div className="text-xs text-red-700 mt-0.5 break-words font-mono">{s.error}</div>
        )}
      </div>
      <div className="text-xs text-muted-foreground tabular-nums shrink-0">{s.ms} ms</div>
    </div>
  );
}

function ResultCard({ title, result }: { title: string; result: RunResult | null }) {
  if (!result) return null;
  const passed = result.steps.filter((s) => s.ok).length;
  const total = result.steps.length;
  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div className="font-serif text-lg">{title}</div>
        <div
          className={`text-sm font-medium ${
            result.ok ? "text-green-700" : "text-red-700"
          }`}
        >
          {passed}/{total} passed
        </div>
      </div>
      <div className="px-5 py-2">
        {result.steps.map((s, i) => (
          <StepRow key={i} s={s} />
        ))}
      </div>
    </div>
  );
}

type AuditResult = {
  ok: boolean;
  generatedAt: string;
  summary: {
    lecturesChecked: number;
    problemsChecked: number;
    lecturesWithIssues: number;
    problemsWithIssues: number;
  };
  lectureIssues: Array<{
    lectureId: number;
    title: string;
    ok: boolean;
    issues: Array<{ quote: string; problem: string; fix: string }>;
    error?: string;
  }>;
  problemIssues: Array<{
    problemId: number;
    assignmentTitle: string;
    prompt: string;
    statedAnswer: string;
    ok: boolean;
    issue?: string;
    betterAnswer?: string;
    error?: string;
  }>;
};

function AuditResultCard({ result }: { result: AuditResult | null }) {
  if (!result) return null;
  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="font-serif text-lg">Content audit results</div>
        <div
          className={`text-sm font-medium ${result.ok ? "text-green-700" : "text-red-700"}`}
        >
          {result.summary.lecturesWithIssues} lecture(s) flagged ·{" "}
          {result.summary.problemsWithIssues} problem answer(s) flagged out of{" "}
          {result.summary.lecturesChecked} + {result.summary.problemsChecked} checked
        </div>
      </div>
      <div className="px-5 py-3 space-y-4">
        {result.lectureIssues.length === 0 && result.problemIssues.length === 0 && (
          <div className="text-sm text-green-700">
            No factual issues flagged by the auditor. Every lecture and every stored "correct
            answer" was approved.
          </div>
        )}
        {result.lectureIssues.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Lectures with flagged statements
            </div>
            <div className="space-y-3">
              {result.lectureIssues.map((l) => (
                <div key={l.lectureId} className="border border-red-200 rounded-md p-3 bg-red-50/40">
                  <div className="font-medium text-sm">{l.title}</div>
                  {l.error && (
                    <div className="text-xs font-mono text-red-700 mt-1">Auditor error: {l.error}</div>
                  )}
                  <ul className="mt-2 space-y-2">
                    {l.issues.map((iss, i) => (
                      <li key={i} className="text-xs">
                        <div className="font-mono bg-white border border-red-200 rounded px-2 py-1">
                          “{iss.quote}”
                        </div>
                        <div className="mt-1 text-red-800">
                          <span className="font-semibold">Problem:</span> {iss.problem}
                        </div>
                        <div className="text-emerald-800">
                          <span className="font-semibold">Fix:</span> {iss.fix}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
        {result.problemIssues.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Problems where stored "correct answer" is suspect
            </div>
            <div className="space-y-3">
              {result.problemIssues.map((p) => (
                <div key={p.problemId} className="border border-red-200 rounded-md p-3 bg-red-50/40">
                  <div className="text-xs text-muted-foreground">{p.assignmentTitle}</div>
                  <div className="text-sm font-medium mt-1">Prompt: {p.prompt}</div>
                  <div className="text-xs mt-1">
                    <span className="font-semibold">Stored answer:</span>{" "}
                    <span className="font-mono">{p.statedAnswer}</span>
                  </div>
                  {p.issue && (
                    <div className="text-xs mt-1 text-red-800">
                      <span className="font-semibold">Issue:</span> {p.issue}
                    </div>
                  )}
                  {p.betterAnswer && (
                    <div className="text-xs mt-1 text-emerald-800">
                      <span className="font-semibold">Suggested answer:</span>{" "}
                      <span className="font-mono">{p.betterAnswer}</span>
                    </div>
                  )}
                  {p.error && (
                    <div className="text-xs mt-1 font-mono text-red-700">Auditor error: {p.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Diagnostics() {
  const [sysBusy, setSysBusy] = useState(false);
  const [synthBusy, setSynthBusy] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [sysResult, setSysResult] = useState<RunResult | null>(null);
  const [synthResult, setSynthResult] = useState<RunResult | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [sysError, setSysError] = useState<string | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  async function runAudit() {
    setAuditBusy(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const r = await fetch(apiUrl("/diagnostics/content-audit"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setAuditResult(await r.json());
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : String(e));
    } finally {
      setAuditBusy(false);
    }
  }

  async function runSystem() {
    setSysBusy(true);
    setSysError(null);
    setSysResult(null);
    try {
      const r = await fetch(apiUrl("/diagnostics/system"));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSysResult(await r.json());
    } catch (e) {
      setSysError(e instanceof Error ? e.message : String(e));
    } finally {
      setSysBusy(false);
    }
  }

  async function runSynthetic() {
    setSynthBusy(true);
    setSynthError(null);
    setSynthResult(null);
    try {
      const r = await fetch(apiUrl("/diagnostics/synthetic-run"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setSynthResult(await r.json());
    } catch (e) {
      setSynthError(e instanceof Error ? e.message : String(e));
    } finally {
      setSynthBusy(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="font-serif text-3xl mb-1">Diagnostics</h1>
          <p className="text-muted-foreground">
            Two self-tests to verify the course app is healthy end-to-end.
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" /> Diagnostic 1 — System check
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Verifies database connectivity, content seed, OpenAI integration (chat + JSON
                mode), detection pipeline, and the grader. Takes a few seconds.
              </p>
            </div>
            <button
              onClick={runSystem}
              disabled={sysBusy}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-60"
            >
              {sysBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {sysBusy ? "Running…" : "Run system check"}
            </button>
          </div>
          {sysError && (
            <div className="text-sm text-red-700 font-mono">{sysError}</div>
          )}
          <ResultCard title="System check results" result={sysResult} />
        </section>

        <section className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" /> Diagnostic 2 — Synthetic student
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Walks a synthetic student through the whole course: reads every lecture,
                starts and submits every assignment (homework, tests, midterm, final), runs
                adaptive practice, asks the AI tutor, and triggers AI + diachronic detection.
                This exercises every endpoint a real student would touch and can take
                several minutes (each grade and generation is an LLM call). The AI detector
                will fire on the synthetic answers — that is the intended behavior.
              </p>
            </div>
            <button
              onClick={runSynthetic}
              disabled={synthBusy}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-60"
            >
              {synthBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {synthBusy ? "Running…" : "Run synthetic student"}
            </button>
          </div>
          {synthError && (
            <div className="text-sm text-red-700 font-mono">{synthError}</div>
          )}
          <ResultCard title="Synthetic student results" result={synthResult} />
        </section>

        <section className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" /> Diagnostic 3 — Content auditor (OpenAI fact-check)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sends every lecture body and every stored "correct answer" to OpenAI and asks for
                an independent verdict on whether each is actually correct. Flags wrong physics,
                misuse of notation (e.g. calling an equation an identity), wrong formulas, and
                answers that don't actually satisfy their prompt. This is the audit you run before
                shipping; it takes several minutes because every lecture and every problem is an
                LLM call.
              </p>
            </div>
            <button
              onClick={runAudit}
              disabled={auditBusy}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-60"
            >
              {auditBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {auditBusy ? "Auditing…" : "Run content audit"}
            </button>
          </div>
          {auditError && (
            <div className="text-sm text-red-700 font-mono">{auditError}</div>
          )}
          <AuditResultCard result={auditResult} />
        </section>
      </div>
    </Layout>
  );
}
