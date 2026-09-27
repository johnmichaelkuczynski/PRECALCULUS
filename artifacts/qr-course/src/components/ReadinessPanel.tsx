import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListAssignments,
  useGenerateAssignmentReadiness,
  type AssignmentReadiness,
} from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, AlertTriangle, BookOpen, CheckCircle2, Sparkles } from "lucide-react";

const LABEL_STYLES: Record<string, string> = {
  ready: "bg-chart-2/20 text-chart-2",
  almost: "bg-chart-4/20 text-chart-4",
  keep_practicing: "bg-chart-4/20 text-chart-4",
  not_ready: "bg-destructive/20 text-destructive",
};

const LABEL_TEXT: Record<string, string> = {
  ready: "Ready",
  almost: "Almost there",
  keep_practicing: "Keep practicing",
  not_ready: "Not ready yet",
};

export function ReadinessPanel() {
  const { data: assignments } = useListAssignments();
  const generate = useGenerateAssignmentReadiness();
  const [selected, setSelected] = useState<number | "">("");
  const [readiness, setReadiness] = useState<AssignmentReadiness | null>(null);
  const [, setLocation] = useLocation();

  function run(id: number) {
    generate.mutate(
      { data: { assignmentId: id } },
      { onSuccess: (data) => setReadiness(data) },
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Am I ready for…?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pick a graded assignment and get a surgical, numbers-backed read on exactly which topics
          to drill before you attempt it.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selected}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : "";
              setSelected(v);
              setReadiness(null);
            }}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm min-w-[260px]"
            data-testid="select-readiness-assignment"
          >
            <option value="">Choose an assignment…</option>
            {assignments?.map((a) => (
              <option key={a.id} value={a.id}>
                Week {a.weekNumber} · {a.title}
              </option>
            ))}
          </select>
          <Button
            onClick={() => typeof selected === "number" && run(selected)}
            disabled={selected === "" || generate.isPending}
          >
            {generate.isPending ? "Analyzing…" : "Check readiness"}
          </Button>
        </div>

        {readiness && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
              <div>
                <div className="text-sm text-muted-foreground">{readiness.assignmentTitle}</div>
                <div className="text-lg font-medium mt-0.5">{readiness.headline}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on {readiness.practiceCount} practice{" "}
                  {readiness.practiceCount === 1 ? "set" : "sets"} so far.
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                    LABEL_STYLES[readiness.readinessLabel] ?? "bg-secondary"
                  }`}
                >
                  {LABEL_TEXT[readiness.readinessLabel] ?? readiness.readinessLabel}
                </span>
                <span className="text-2xl font-serif font-bold text-primary">
                  {Math.round(readiness.readinessScore)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {readiness.pointers.map((p, i) => {
                const Icon =
                  p.severity === "focus"
                    ? AlertTriangle
                    : p.severity === "review"
                      ? BookOpen
                      : CheckCircle2;
                const tone =
                  p.severity === "focus"
                    ? "border-destructive/40 bg-destructive/5 text-destructive"
                    : p.severity === "review"
                      ? "border-chart-4/40 bg-chart-4/5 text-chart-4"
                      : "border-chart-2/40 bg-chart-2/5 text-chart-2";
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-md border p-3 ${tone}`}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1 text-sm text-foreground">
                      <span>{p.text}</span>
                      {p.topicId != null && (
                        <button
                          onClick={() => setLocation(`/practice/topic/${p.topicId}`)}
                          className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          drill this
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => typeof selected === "number" && setLocation(`/assignments/${selected}`)}
              >
                Go to the assignment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
