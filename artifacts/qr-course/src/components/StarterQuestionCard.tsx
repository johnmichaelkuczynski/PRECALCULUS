import { useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MathKeyboard } from "@/components/MathKeyboard";

interface Props {
  index: number;
  question: string;
  pending: boolean;
  onSubmitAttempt: (attempt: string) => void;
  onShowAnswer: () => void;
  onDismiss: () => void;
}

export function StarterQuestionCard({
  index,
  question,
  pending,
  onSubmitAttempt,
  onShowAnswer,
  onDismiss,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function insertAtCursor(sym: string) {
    const ta = taRef.current;
    if (!ta) {
      setValue((v) => v + sym);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + sym + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + sym.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function submit() {
    if (!value.trim()) return;
    onSubmitAttempt(value);
    setValue("");
    setOpen(false);
  }

  return (
    <div className="group rounded-md border border-border bg-background/40 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2 p-2">
        <div className="flex-1 text-sm leading-snug" data-testid={`suggestion-${index}`}>
          <MarkdownRenderer content={question} />
        </div>
        <button
          onClick={onDismiss}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 -mt-1"
          title="Dismiss this question"
          data-testid={`button-dismiss-suggestion-${index}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-2 pb-2">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={pending}
          className="text-xs font-medium px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid={`button-try-suggestion-${index}`}
        >
          {open ? "Cancel" : "Try answering"}
        </button>
        <button
          onClick={onShowAnswer}
          disabled={pending}
          className="text-xs font-medium px-2 py-1 rounded-md border border-border bg-background hover:bg-secondary text-foreground disabled:opacity-50"
          data-testid={`button-show-suggestion-${index}`}
        >
          Just show me the answer
        </button>
      </div>
      {open && (
        <div className="px-2 pb-2 flex flex-col gap-2">
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Type your answer — use the math keys below for symbols…"
            rows={3}
            className="bg-secondary border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[72px]"
            data-testid={`input-attempt-${index}`}
            autoFocus
          />
          <MathKeyboard onInsert={insertAtCursor} />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={submit}
              disabled={!value.trim() || pending}
              data-testid={`button-submit-attempt-${index}`}
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Check my answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
