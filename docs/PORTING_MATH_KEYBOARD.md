# Porting the Math Keyboard + Per-Question Quick-Pick Bar to Another App

Paste this entire file into the Replit Agent chat of the target app. The agent
should follow it end-to-end without asking clarifying questions.

---

## What you are installing

Two things, in order:

1. **`QuickPickBar`** — a small bar that appears **directly above** the answer
   textarea. It reads the current question's prompt (LaTeX-aware), figures out
   which symbols the student will actually need (`∫`, `≤`, `Σ`, `π`, `≠`, …),
   and surfaces them as one-click buttons. This is the "magic" piece.
2. **`MathKeyboard`** — the full categorized symbol keyboard (Numbers, Algebra,
   Statistics, Calculus, Greek, Logic, Sets, …). It already exists in math-ish
   apps; if the target app does not have one, build a basic version with tabbed
   categories. The QuickPickBar sits **above** it.

The interesting / portable code is the QuickPickBar. The integration pattern
("answer textarea component takes an optional `promptSource` prop and renders
the bar when present") is what makes it drop-in.

---

## Assumptions about the target app

- React + TypeScript + Tailwind. Adapt class names if the target uses a
  different styling system.
- There is **one** answer-entry component (something like `AnswerInput.tsx`)
  that wraps the textarea and is reused across all answer surfaces (topic
  practice, in-lecture practice, assignment runner, exam runner, etc.). If
  there is not, refactor to that first — otherwise you will install the bar in
  one place and miss the others.
- Question prompts are stored as **Markdown with LaTeX** (e.g.
  `Evaluate the integral $\int_0^2 3x^2\,dx$`). LaTeX detection is critical;
  do not assume Unicode-only prompts.
- The textarea exposes a cursor-aware insert helper (so a button click inserts
  the symbol **at the caret**, not appended to the end). If it doesn't, add
  one — `selectionStart` / `selectionEnd` on the `<textarea>` ref.

---

## Step 1 — Create the component

Create `src/components/QuickPickBar.tsx` with **exactly** the following code.
Do not edit the symbol tables or the LaTeX map; they are the result of a long
iteration cycle and are tuned to the kinds of math prompts these courses
produce.

```tsx
import { useMemo } from "react";

const FAMILIES: string[][] = [
  ["=", "≠", "≈", "≡", "≅", "≜", "∝"],
  ["<", ">", "≤", "≥", "≪", "≫"],
  ["±", "∓", "·", "×", "÷", "√", "∛", "∜"],
  ["²", "³", "ⁿ", "⁰", "¹", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"],
  ["₀", "₁", "₂", "₃", "ₙ", "ₜ", "ₓ", "ᵧ"],
  ["Σ", "Π", "∑", "∏"],
  ["Δ", "δ", "∇", "∂"],
  ["∫", "∬", "∭", "∮"],
  ["lim", "→", "↦", "∞"],
  ["e", "ln", "log"],
  ["μ", "σ", "σ²", "x̄", "p̂", "s"],
  ["P(A)", "P(A|B)", "E(X)", "Var(X)"],
  ["X ∼ N(μ,σ²)", "z", "t", "χ²", "α", "β"],
  ["→", "↔", "⇒", "⇔"],
  ["¬", "∧", "∨", "⊕", "⊤", "⊥"],
  ["∀", "∃", "∄", "∴", "∵"],
  ["∈", "∉", "⊂", "⊆", "⊄", "⊇", "⊊"],
  ["∪", "∩", "∅", "∖", "Aᶜ"],
  ["ℕ", "ℤ", "ℚ", "ℝ", "ℂ", "𝔽"],
  ["π", "θ", "φ", "λ", "ω", "γ", "ε", "ρ", "τ", "η"],
  ["|x|", "n!", "⌊x⌋", "⌈x⌉", "mod"],
];

// LaTeX command -> unicode symbol the student would actually type.
const LATEX_MAP: Record<string, string> = {
  int: "∫", iint: "∬", iiint: "∭", oint: "∮",
  sum: "∑", prod: "∏",
  partial: "∂", nabla: "∇", Delta: "Δ", delta: "δ",
  infty: "∞", lim: "lim",
  to: "→", rightarrow: "→", leftarrow: "←",
  leftrightarrow: "↔", Rightarrow: "⇒", Leftrightarrow: "⇔",
  mapsto: "↦",
  ne: "≠", neq: "≠", approx: "≈", equiv: "≡", cong: "≅", propto: "∝", sim: "∼",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ll: "≪", gg: "≫",
  pm: "±", mp: "∓", times: "×", div: "÷", cdot: "·", sqrt: "√",
  alpha: "α", beta: "β", gamma: "γ", Gamma: "Γ",
  epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", Theta: "Θ", iota: "ι", kappa: "κ",
  lambda: "λ", Lambda: "Λ", mu: "μ", nu: "ν",
  xi: "ξ", Xi: "Ξ", pi: "π", Pi: "Π",
  rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ",
  upsilon: "υ", phi: "φ", varphi: "φ", Phi: "Φ",
  chi: "χ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω",
  forall: "∀", exists: "∃", nexists: "∄",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆",
  supset: "⊃", supseteq: "⊇",
  cup: "∪", cap: "∩", emptyset: "∅", setminus: "∖",
  land: "∧", wedge: "∧", lor: "∨", vee: "∨",
  neg: "¬", lnot: "¬", oplus: "⊕", top: "⊤", bot: "⊥",
  therefore: "∴", because: "∵",
  mathbbN: "ℕ", mathbbZ: "ℤ", mathbbQ: "ℚ", mathbbR: "ℝ", mathbbC: "ℂ",
  hat: "p̂", bar: "x̄",
};

function harvestLatex(source: string, into: Set<string>): void {
  const mathbbRe = /\\mathbb\{([NZQRC])\}/g;
  let m: RegExpExecArray | null;
  while ((m = mathbbRe.exec(source)) !== null) {
    const sym = LATEX_MAP["mathbb" + m[1]];
    if (sym) into.add(sym);
  }
  const cmdRe = /\\([A-Za-z]+)/g;
  while ((m = cmdRe.exec(source)) !== null) {
    const sym = LATEX_MAP[m[1]!];
    if (sym) into.add(sym);
  }
  if (/\^/.test(source)) into.add("²");
  if (/_/.test(source)) into.add("₂");
}

const TOKEN_REGEX = /(P\(A\|B\)|P\(A\)|E\(X\)|Var\(X\)|σ²|x̄|p̂|Aᶜ|X ∼ N\(μ,σ²\)|[^\x00-\x7F]|[<>≤≥≠≈≡=±∓·×÷√∛∜∞])/gu;

function harvest(source: string): string[] {
  if (!source) return [];
  const found = new Set<string>();
  const m = source.match(TOKEN_REGEX);
  if (m) m.forEach((s) => found.add(s));
  harvestLatex(source, found);
  const expanded = new Set<string>(found);
  for (const fam of FAMILIES) {
    if (fam.some((sym) => found.has(sym))) {
      fam.forEach((sym) => expanded.add(sym));
    }
  }
  const order: string[] = [];
  const seen = new Set<string>();
  for (const fam of FAMILIES) {
    for (const sym of fam) {
      if (expanded.has(sym) && !seen.has(sym)) {
        order.push(sym);
        seen.add(sym);
      }
    }
  }
  for (const sym of expanded) {
    if (!seen.has(sym)) {
      order.push(sym);
      seen.add(sym);
    }
  }
  return order;
}

interface QuickPickBarProps {
  source: string;
  onInsert: (symbol: string) => void;
}

export function QuickPickBar({ source, onInsert }: QuickPickBarProps) {
  const symbols = useMemo(() => harvest(source), [source]);
  if (symbols.length === 0) return null;
  return (
    <div className="bg-primary/5 border border-primary/30 rounded-md p-2 flex flex-col gap-1.5">
      <div className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold px-1">
        Symbols for this question — click to insert
      </div>
      <div className="flex flex-wrap gap-1.5">
        {symbols.map((sym, i) => (
          <button
            key={`${sym}-${i}`}
            type="button"
            onClick={() => onInsert(sym)}
            className="min-w-9 h-10 px-2.5 rounded border border-primary/40 bg-white shadow-sm flex items-center justify-center font-mono text-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all active:scale-95"
            data-testid={`quickpick-${sym}`}
          >
            {sym}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Step 2 — Wire it into the answer-input component

Open the single answer-entry component (commonly `src/components/AnswerInput.tsx`).

1. Add an **optional** `promptSource?: string` to its props.
2. Render `<QuickPickBar source={promptSource} onInsert={insertAtCursor} />`
   **immediately above** the existing `<textarea>` (not below the keyboard, not
   below the textarea — directly above the textarea is what the students
   actually look at first).
3. Reuse the same `insertAtCursor` helper that the existing `MathKeyboard`
   already uses. If there isn't one, write it: grab the textarea ref, use
   `selectionStart` / `selectionEnd` to splice the symbol into `value`, fire
   `onChange`, then restore the caret to `start + symbol.length` after the
   React render (use `requestAnimationFrame` or a microtask).
4. Do **not** render the bar at all when `promptSource` is empty — the bar's
   own `harvest()` returns `[]` and the component returns `null` in that case,
   but skipping the prop entirely is even cleaner.

Sketch:

```tsx
interface AnswerInputProps {
  value: string;
  onChange: (val: string, trace?: TypingTrace) => void;
  placeholder?: string;
  disabled?: boolean;
  promptSource?: string;          // NEW
}

export function AnswerInput({ ..., promptSource }: AnswerInputProps) {
  // ... existing refs, handlers, insertAtCursor ...
  return (
    <div className="flex flex-col gap-2">
      {promptSource && (
        <QuickPickBar source={promptSource} onInsert={insertAtCursor} />
      )}
      <textarea ref={taRef} value={value} onChange={...} ... />
      <span className="text-xs ...">Pasting is disabled.</span>
      {!disabled && <MathKeyboard onInsert={insertAtCursor} ... />}
    </div>
  );
}
```

---

## Step 3 — Pass `promptSource` from every call site

This is the step that is most commonly half-done. **Grep the repo** for every
place that renders the answer-input component and add `promptSource={...}`.
Typical call sites in a course-style app:

- Topic / chapter practice page
- In-lecture "Practice on this" tab
- Assignment / homework runner
- Quiz, test, midterm, final runner
- Any standalone "try a problem" widget

For each one, pass the **raw prompt string** (the same string the prompt
renderer receives), not the rendered HTML:

```tsx
<AnswerInput
  value={answer}
  onChange={(v, t) => { setAnswer(v); setTrace(t); }}
  disabled={!!grade}
  promptSource={problem?.prompt}   // NEW
/>
```

Verification:

```
rg -n "AnswerInput" src
```

Every result that renders `<AnswerInput ...>` must include `promptSource=`. If
any does not, the bar will silently fail to appear on that surface — exactly
the bug to avoid.

---

## Step 4 — Make the answer area visible

Students cannot grade their own typing if the textarea font is 14px. Update
the textarea styling in `AnswerInput.tsx` to something like:

```
min-h-[180px] p-5 font-mono text-3xl leading-relaxed
```

And give the prompt-display container above the answer area `text-lg` and a
generous `min-h`. Small textareas were the #1 complaint during dogfooding.

---

## Step 5 — Smoke test

Open a problem on every answer surface listed in Step 3 and confirm:

1. The bar appears **directly above** the textarea (not below the keyboard).
2. The bar's symbols match what the prompt actually asks for. Test with all
   four input styles:
   - Pure Unicode prompt: `Solve μ ≥ 5`
   - LaTeX-command prompt: `Evaluate $\int_0^2 3x^2 \, dx$`
   - `\mathbb{}` set names: `Is $\pi \in \mathbb{Q}$?`
   - Mixed: `Show $\sum_{i=1}^n i = n(n+1)/2$`
3. Clicking a button inserts the symbol **at the caret position**, not at the
   end of whatever is typed.
4. The full `MathKeyboard` is still reachable below (the bar is a shortcut,
   not a replacement).

---

## Common mistakes to avoid

- **Harvesting from rendered HTML.** Harvest from the raw prompt string. The
  KaTeX-rendered DOM strips backslashes and you'll miss every LaTeX command.
- **Forgetting one call site.** See Step 3. Grep, do not trust memory.
- **Inserting at the end of the textarea.** Use cursor position. Students with
  partially-typed answers will revolt otherwise.
- **Skipping the family expansion.** Seeing `\int` in the prompt should
  surface `∫ ∬ ∭ ∮`, not just `∫`. Same for super/subscripts and the equality
  family. The included `FAMILIES` table handles this — don't simplify it away.
- **Touching the `LATEX_MAP` or `FAMILIES` for "code style."** They are
  intentionally compact tables. Reformat if you must, but do not drop entries.
