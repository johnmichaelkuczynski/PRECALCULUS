import { useLocation } from "wouter";
import { ArrowRight, BookOpen, Calculator, Compass, FunctionSquare, Sigma } from "lucide-react";
import { TopicsList } from "@/components/TopicsList";
import { CompanyContact } from "@/components/CompanyContact";

const weeks = [
  { number: "01", title: "Functions & their graphs", detail: "Build fluency with intervals, graphs, transformations, composition, inverses, and rates of change.", mark: "f(x)" },
  { number: "02", title: "Polynomial & rational functions", detail: "Explore zeros, complex numbers, polynomial behavior, asymptotes, and inequalities.", mark: "xⁿ" },
  { number: "03", title: "Exponential, logarithmic & trigonometric functions", detail: "Model growth and decay, work with logarithms, and make the unit circle your own.", mark: "eˣ" },
  { number: "04", title: "Trigonometry & further topics", detail: "Connect identities, triangles, polar form, conics, vectors, sequences, and series.", mark: "sin θ" },
];

const features = [
  { icon: BookOpen, title: "29 focused lectures", detail: "A short, clear explanation for every topic in the four-week sequence." },
  { icon: Calculator, title: "Math, made writable", detail: "Use the built-in keyboard to express equations, symbols, and working." },
  { icon: Compass, title: "A tutor in the margins", detail: "Ask for a hint, another explanation, or a worked example as you learn." },
  { icon: FunctionSquare, title: "Practice that responds", detail: "Try topic-specific problems and get useful feedback on your reasoning." },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const openCourse = () => setLocation("/dashboard");

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <button onClick={openCourse} className="flex items-center gap-3 text-left" aria-label="Open Precalculus">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sigma className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-lg font-semibold leading-tight">Precalculus</span>
            <span className="block text-[10px] font-medium uppercase tracking-[.18em] text-muted-foreground">a four-week course</span>
          </span>
        </button>
        <button onClick={openCourse} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary/50 hover:text-primary" data-testid="button-open-course">
          Open course
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl items-start gap-10 px-5 sm:px-8">
        <aside className="sticky top-5 hidden max-h-[calc(100dvh-2rem)] shrink-0 overflow-y-auto py-8 md:block">
          <TopicsList />
        </aside>

        <main className="min-w-0 flex-1">
          <section className="relative isolate overflow-hidden py-16 sm:py-24 lg:py-32">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-8 -z-10 hidden h-72 w-72 rounded-full border border-primary/15 lg:block" />
            <div aria-hidden="true" className="pointer-events-none absolute right-[-3rem] top-20 -z-10 hidden h-52 w-52 rounded-full border border-primary/15 lg:block" />
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Four weeks · 29 topics · start anywhere
              </div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[.2em] text-primary">From the number line to the unit circle</p>
              <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                Make sense of the <span className="text-primary">shape</span> of mathematics.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Precalculus is a way of seeing how quantities change. Get comfortable with functions, follow their patterns, and carry the ideas all the way to trigonometry and beyond.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button onClick={openCourse} className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90" data-testid="button-start">
                  Begin with the course <ArrowRight className="h-4 w-4" />
                </button>
                <span className="text-sm text-muted-foreground">Free to explore, no sign-up needed</span>
              </div>
              <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
                <span><strong className="font-mono text-foreground">04</strong> connected weeks</span>
                <span><strong className="font-mono text-foreground">29</strong> lecture topics</span>
                <span><strong className="font-mono text-foreground">∞</strong> ways to ask why</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 border-y border-border py-8 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(({ icon: Icon, title, detail }, index) => (
              <article key={title} className="flex gap-4 px-2 py-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${index % 2 ? "bg-accent/50 text-foreground" : "bg-primary/10 text-primary"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-base font-semibold">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="py-16 sm:py-20">
            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[.18em] text-primary">The course map</p>
                <h2 className="font-serif text-3xl font-semibold sm:text-4xl">Four weeks, one growing picture.</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Each week gives you new tools, then connects them to ideas you already know.</p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {weeks.map((week) => (
                <button key={week.number} onClick={openCourse} className="group grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-4 py-5 text-left sm:grid-cols-[4rem_1fr_5.5rem] sm:gap-6" data-testid={`button-week-${week.number}`}>
                  <span className="font-mono text-sm text-primary">{week.number}</span>
                  <span>
                    <span className="block font-serif text-lg font-semibold transition group-hover:text-primary">{week.title}</span>
                    <span className="mt-1 block max-w-2xl text-sm leading-relaxed text-muted-foreground">{week.detail}</span>
                  </span>
                  <span className="hidden rounded-lg bg-secondary px-2 py-1 text-center font-mono text-sm text-secondary-foreground sm:block">{week.mark}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-16 rounded-2xl border border-border bg-card p-6 sm:p-9">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[.18em] text-primary">Start with a question</p>
                <h2 className="font-serif text-2xl font-semibold sm:text-3xl">What does a function tell you?</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">It turns an input into an output. But its graph can show you much more: where it rises, where it turns, and how it behaves when you change the rules.</p>
              </div>
              <div aria-hidden="true" className="relative hidden h-28 w-48 overflow-hidden rounded-xl bg-secondary md:block">
                <div className="absolute inset-x-4 top-1/2 h-px bg-border" />
                <div className="absolute inset-y-3 left-1/2 w-px bg-border" />
                <svg viewBox="0 0 192 112" className="absolute inset-0 h-full w-full" fill="none" aria-hidden="true">
                  <path d="M15 88 C 46 92, 59 20, 95 24 S 143 91, 177 18" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="95" cy="24" r="4" fill="hsl(var(--accent))" />
                </svg>
              </div>
            </div>
          </section>

          <section className="pb-16 md:hidden">
            <TopicsList className="mx-auto w-full max-w-sm" />
          </section>
        </main>
      </div>
      <footer className="border-t border-border px-5 py-6 text-sm text-muted-foreground sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>Precalculus — from functions to further topics.</span>
          <CompanyContact />
        </div>
      </footer>
    </div>
  );
}