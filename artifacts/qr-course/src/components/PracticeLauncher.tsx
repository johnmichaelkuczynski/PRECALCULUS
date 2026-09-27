import { useLocation } from "wouter";
import {
  useGeneratePracticeAssignment,
  useListPracticeAssignments,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, History } from "lucide-react";

export function PracticeLauncher({
  sourceAssignmentId,
  variant = "block",
}: {
  sourceAssignmentId: number;
  variant?: "block" | "inline";
}) {
  const [, setLocation] = useLocation();
  const generate = useGeneratePracticeAssignment();
  const { data: prior } = useListPracticeAssignments({ sourceAssignmentId });

  function launch() {
    generate.mutate(
      { data: { sourceAssignmentId } },
      { onSuccess: (pa) => setLocation(`/practice-assignments/${pa.id}`) },
    );
  }

  const priorCount = prior?.length ?? 0;
  const latest = prior?.[0];

  if (variant === "inline") {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={launch}
        disabled={generate.isPending}
        data-testid={`button-practice-${sourceAssignmentId}`}
      >
        <Sparkles className="w-4 h-4 mr-1.5" />
        {generate.isPending ? "Building…" : "Practice this"}
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-chart-4/40 bg-chart-4/5 p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-chart-4/15 p-2 shrink-0">
          <Sparkles className="w-5 h-5 text-chart-4" />
        </div>
        <div>
          <div className="font-medium text-sm">Practice before you commit</div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate an unlimited supply of fresh practice problems — same shape as the graded
            work, never the same questions twice, and the tutor stays on-screen to help. None of it
            counts against your grade.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={launch}
          disabled={generate.isPending}
          className="bg-chart-4 hover:bg-chart-4/90 text-white"
          data-testid={`button-practice-${sourceAssignmentId}`}
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${generate.isPending ? "animate-spin" : ""}`} />
          {generate.isPending ? "Building a fresh set…" : "Generate a practice set"}
        </Button>
        {latest && latest.status === "in_progress" && (
          <Button
            variant="outline"
            onClick={() => setLocation(`/practice-assignments/${latest.id}`)}
          >
            Resume last practice
          </Button>
        )}
      </div>
      {priorCount > 0 && (
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          You've done {priorCount} practice {priorCount === 1 ? "set" : "sets"} for this assignment.
        </div>
      )}
    </div>
  );
}
