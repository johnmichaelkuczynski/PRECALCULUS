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
  // integrals / sums / products
  int: "∫", iint: "∬", iiint: "∭", oint: "∮",
  sum: "∑", prod: "∏",
  // calculus / change
  partial: "∂", nabla: "∇", Delta: "Δ", delta: "δ",
  infty: "∞", lim: "lim",
  to: "→", rightarrow: "→", leftarrow: "←",
  leftrightarrow: "↔", Rightarrow: "⇒", Leftrightarrow: "⇔",
  mapsto: "↦",
  // equality family
  ne: "≠", neq: "≠", approx: "≈", equiv: "≡", cong: "≅", propto: "∝", sim: "∼",
  // ordering
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ll: "≪", gg: "≫",
  // arithmetic
  pm: "±", mp: "∓", times: "×", div: "÷", cdot: "·", sqrt: "√",
  // greek (lowercase + a few uppercase)
  alpha: "α", beta: "β", gamma: "γ", Gamma: "Γ",
  epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", Theta: "Θ", iota: "ι", kappa: "κ",
  lambda: "λ", Lambda: "Λ", mu: "μ", nu: "ν",
  xi: "ξ", Xi: "Ξ", pi: "π", Pi: "Π",
  rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ",
  upsilon: "υ", phi: "φ", varphi: "φ", Phi: "Φ",
  chi: "χ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω",
  // logic + sets
  forall: "∀", exists: "∃", nexists: "∄",
  in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆",
  supset: "⊃", supseteq: "⊇",
  cup: "∪", cap: "∩", emptyset: "∅", setminus: "∖",
  land: "∧", wedge: "∧", lor: "∨", vee: "∨",
  neg: "¬", lnot: "¬", oplus: "⊕", top: "⊤", bot: "⊥",
  therefore: "∴", because: "∵",
  // blackboard sets
  mathbbN: "ℕ", mathbbZ: "ℤ", mathbbQ: "ℚ", mathbbR: "ℝ", mathbbC: "ℂ",
  // hats / bars (commonly seen in stats)
  hat: "p̂", bar: "x̄",
};

function harvestLatex(source: string, into: Set<string>): void {
  // \mathbb{R} -> mathbbR
  const mathbbRe = /\\mathbb\{([NZQRC])\}/g;
  let m: RegExpExecArray | null;
  while ((m = mathbbRe.exec(source)) !== null) {
    const sym = LATEX_MAP["mathbb" + m[1]];
    if (sym) into.add(sym);
  }
  // \command (word characters only)
  const cmdRe = /\\([A-Za-z]+)/g;
  while ((m = cmdRe.exec(source)) !== null) {
    const sym = LATEX_MAP[m[1]!];
    if (sym) into.add(sym);
  }
  // raw ^ and _ -> hint at super/subscripts
  if (/\^/.test(source)) into.add("²");
  if (/_/.test(source)) into.add("₂");
}

const TOKEN_REGEX = /(P\(A\|B\)|P\(A\)|E\(X\)|Var\(X\)|σ²|x̄|p̂|Aᶜ|X ∼ N\(μ,σ²\)|[^\x00-\x7F]|[<>≤≥≠≈≡=±∓·×÷√∛∜∞])/gu;

function harvest(source: string): string[] {
  if (!source) return [];
  const found = new Set<string>();

  // 1. unicode + ascii operators
  const m = source.match(TOKEN_REGEX);
  if (m) m.forEach((s) => found.add(s));

  // 2. LaTeX commands (\int, \sum, \pi, \le, \mathbb{R}, etc.)
  harvestLatex(source, found);

  // 3. Expand each match to its full family
  const expanded = new Set<string>(found);
  for (const fam of FAMILIES) {
    if (fam.some((sym) => found.has(sym))) {
      fam.forEach((sym) => expanded.add(sym));
    }
  }

  // 4. Stable order: family-by-family, then any leftover originals
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
