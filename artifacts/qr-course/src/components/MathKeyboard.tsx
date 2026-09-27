import { useState } from "react";
import { Delete } from "lucide-react";

type MathKey = {
  label: string;
  insert: string;
  cursorOffset?: number;
  action?: "back" | "clear";
};
type TabName = "Numbers" | "Algebra" | "Functions" | "Trigonometry" | "Geometry";
const key = (label: string, insert = label, cursorOffset = 0): MathKey => ({ label, insert, cursorOffset });

const KEYS: Record<TabName, MathKey[]> = {
  Numbers: [
    ...["7", "8", "9"].map(x => key(x)), key("÷", "/"), key("⌫", "", 0),
    ...["4", "5", "6"].map(x => key(x)), key("×", "×"), { label: "Clear", insert: "", action: "clear" as const },
    ...["1", "2", "3"].map(x => key(x)), key("−", "−"), key("("),
    key("0"), key("."), key("="), key("+"), key(")"),
  ].map(k => k.label === "⌫" ? { ...k, action: "back" as const } : k),
  Algebra: [
    key("x²", "²"), key("x³", "³"), key("xⁿ", "^()", -1), key("√", "√()", -1),
    key("fraction", "()/()", -4), key("|x|", "| |", -2),
    key("±"), key("≠"), key("≤"), key("≥"), key("∞"), key("π"),
    key("x₁", "₁"), key("x₂", "₂"), key("a₁", "₁"), key("n", "n"),
    key("i"), key("∑"), key("→"), key("∈"), key("∪"), key("∩"),
  ],
  Functions: [
    key("f(x)", "f()", -1), key("g(x)", "g()", -1), key("f⁻¹(x)", "f⁻¹()", -1),
    key("f∘g", "(f ∘ g)(x)"), key("Δx"), key("Δy"),
    key("slope", "(y₂−y₁)/(x₂−x₁)"),
    key("difference quotient", "(f(x+h)−f(x))/h"),
    key("vertex", "a(x−h)²+k"),
    key("log", "log()", -1), key("ln", "ln()", -1),
    key("eˣ", "e^()", -1), key("xⁿ", "^()", -1),
    key("(", "(", 0), key(")", ")", 0),
  ],
  Trigonometry: [
    ...["sin", "cos", "tan", "sec", "csc", "cot", "arcsin", "arccos", "arctan"].map(x => key(x, `${x}()`, -1)),
    ...["θ", "α", "β", "γ", "π", "°", "rad", "sin²θ", "cos²θ", "2π"].map(x => key(x)),
    key("sin²θ+cos²θ", "sin²θ + cos²θ = 1"),
  ],
  Geometry: [
    ...["∠", "△", "⊥", "∥", "≅", "≈", "⟨", "⟩", "·", "r", "θ"].map(x => key(x)),
    key("(x,y)", "(,)", -2), key("distance", "√((x₂−x₁)²+(y₂−y₁)²)"),
    key("vector", "⟨,⟩", -2), key("x²+y²", "x²+y²"),
    key("sum", "a₁/(1−r)"),
  ],
};

interface MathKeyboardProps {
  onInsert: (symbol: string, cursorOffset?: number) => void;
  onBackspace?: () => void;
  onClear?: () => void;
}

export function MathKeyboard({ onInsert, onBackspace, onClear }: MathKeyboardProps) {
  const [activeTab, setActiveTab] = useState<TabName>("Numbers");

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm" aria-label="Precalculus math keyboard" data-testid="math-keyboard">
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Math symbols">
        {(Object.keys(KEYS) as TabName[]).map(tab => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeTab === tab ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}
            data-testid={`mathkb-tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className={activeTab === "Numbers" ? "grid grid-cols-5 gap-1.5" : "flex flex-wrap gap-1.5"} role="tabpanel">
        {KEYS[activeTab].map((item, index) => (
          <button
            key={`${activeTab}-${index}`}
            type="button"
            onMouseDown={event => event.preventDefault()}
            onClick={() => {
              if (item.action === "back") onBackspace?.();
              else if (item.action === "clear") onClear?.();
              else onInsert(item.insert, item.cursorOffset);
            }}
            aria-label={item.action === "back" ? "Delete previous character" : item.action === "clear" ? "Clear answer" : `Insert ${item.label}`}
            title={item.label}
            className="min-h-11 min-w-11 rounded-lg border border-border bg-background px-2 py-1 font-mono text-sm font-medium shadow-sm transition hover:border-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
            data-testid={`mathkb-key-${activeTab}-${item.label}`}
          >
            {item.action === "back" ? <Delete className="mx-auto h-4 w-4" aria-hidden="true" /> : item.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Tap a symbol to add it at the cursor. Parentheses place the cursor inside.</p>
    </div>
  );
}