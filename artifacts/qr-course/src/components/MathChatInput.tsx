import { useRef, useState } from "react";
import { Send, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathKeyboard } from "@/components/MathKeyboard";

interface MathChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  pending?: boolean;
  rows?: number;
  minHeightClass?: string;
}

/**
 * A tutor/chat input with the same on-screen math keyboard the answer fields
 * use, so students can compose functions, exponents, and trigonometry
 * when asking questions — not just plain text. The keyboard toggles open from
 * the Σ button and inserts at the cursor.
 */
export function MathChatInput({
  value,
  onChange,
  onSend,
  placeholder,
  pending,
  rows = 3,
  minHeightClass = "min-h-[72px]",
}: MathChatInputProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);

  function insertAtCursor(sym: string, cursorOffset = 0) {
    if (!sym) return;
    const ta = taRef.current;
    if (!ta) {
      onChange(value + sym);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + sym + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
       const pos = Math.max(start, start + sym.length + cursorOffset);
      try {
        ta.setSelectionRange(pos, pos);
      } catch {}
    });
  }

  function backspaceAtCursor() {
    const ta = taRef.current;
    if (!ta) {
      onChange(value.slice(0, -1));
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    let next: string;
    let pos: number;
    if (start === end) {
      if (start === 0) return;
      next = value.slice(0, start - 1) + value.slice(end);
      pos = start - 1;
    } else {
      next = value.slice(0, start) + value.slice(end);
      pos = start;
    }
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      try {
        ta.setSelectionRange(pos, pos);
      } catch {}
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          rows={rows}
          className={`flex-1 bg-secondary border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y ${minHeightClass} max-h-[280px]`}
          data-testid="input-math-chat"
        />
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            size="lg"
            variant={showKeyboard ? "default" : "outline"}
            onClick={() => setShowKeyboard((v) => !v)}
             title={showKeyboard ? "Hide math keyboard" : "Show math keyboard"}
             aria-label={showKeyboard ? "Hide math keyboard" : "Show math keyboard"}
             aria-expanded={showKeyboard}
            data-testid="button-toggle-math-keyboard"
          >
            <Sigma className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            onClick={onSend}
            disabled={!value.trim() || pending}
            data-testid="button-send-math-chat"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {showKeyboard && (
        <MathKeyboard
          onInsert={insertAtCursor}
          onBackspace={backspaceAtCursor}
          onClear={() => onChange("")}
        />
      )}
    </div>
  );
}
