import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, PenTool, BarChart3, Activity, RotateCcw, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CompanyContact } from "@/components/CompanyContact";
import { customFetch, setAiProviderGetter } from "@workspace/api-client-react";

const AI_PROVIDERS = [
  { value: "perplexity", label: "Perplexity" },
  { value: "venice", label: "Venice AI" },
  { value: "openai", label: "OpenAI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "grok", label: "Grok" },
] as const;

export function Sidebar() {
  const [location] = useLocation();
  const [provider, setProvider] = useState(() =>
    localStorage.getItem("precalculus-ai-provider") || "perplexity",
  );

  useEffect(() => {
    localStorage.setItem("precalculus-ai-provider", provider);
    setAiProviderGetter(() => provider);
  }, [provider]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assignments", label: "Assignments", icon: PenTool },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="sticky top-0 z-20 flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:h-[100dvh] md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-sidebar-border p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary font-serif text-lg font-bold text-sidebar-primary-foreground">∑</span>
          <span>
            <span className="block font-serif text-lg font-semibold tracking-tight">Precalculus</span>
            <span className="block text-[10px] uppercase tracking-[.16em] text-muted-foreground">four-week course</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:gap-2 md:overflow-y-auto md:px-4 md:py-6">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors md:gap-3 md:py-2.5 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
            >
              <item.icon className="h-4 w-4 md:h-5 md:w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden flex-col gap-3 border-t border-sidebar-border p-4 md:flex">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>LLM provider</span>
          <select
            aria-label="LLM provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            data-testid="select-ai-provider"
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs normal-case tracking-normal text-foreground"
          >
            {AI_PROVIDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="flex justify-center text-muted-foreground">
          <CompanyContact compact />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const [location, setLocation] = useLocation();
  const active = location.startsWith("/diagnostics");
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [expanding, setExpanding] = useState(false);

  async function handleExpandLectures() {
    if (
      !confirm(
         "Generate Medium and Long versions of every lecture? This runs the tutor over all 29 lectures twice (medium, then long). Takes a few minutes.",
      )
    )
      return;
    setExpanding(true);
    try {
       const mData = await customFetch<{ updated?: number; failed?: number; total?: number }>("/api/diagnostics/expand-lectures?level=medium", { method: "POST", responseType: "json" });
       const lRes = await customFetch<{ updated?: number; failed?: number; total?: number }>("/api/diagnostics/expand-lectures?level=long", { method: "POST", responseType: "json" });
       const lData = lRes;
      await qc.invalidateQueries();
      alert(
        `Medium: ${mData.updated ?? 0}/${mData.total ?? 0} (${mData.failed ?? 0} failed)\n` +
          `Long:   ${lData.updated ?? 0}/${lData.total ?? 0} (${lData.failed ?? 0} failed)`,
      );
    } catch (e) {
      alert(`Lecture rewrite failed: ${(e as Error).message}`);
    } finally {
      setExpanding(false);
    }
  }

  async function handleReset() {
    if (
      !confirm(
        "Reset your course? This deletes your assignment attempts, answers, and practice sessions, but keeps lectures and assignments.",
      )
    )
      return;
    setResetting(true);
    try {
       await customFetch<unknown>("/api/diagnostics/reset", { method: "POST" });
      await qc.invalidateQueries();
      setLocation("/");
    } catch (e) {
      alert(`Reset failed: ${(e as Error).message}`);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 border-b border-border bg-background/80 backdrop-blur">
      <button
        onClick={handleExpandLectures}
        disabled={expanding}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-border hover:bg-secondary disabled:opacity-50"
        data-testid="button-expand-lectures"
        title="Rewrite every lecture with worked examples after each point"
      >
        <Sparkles className={`w-4 h-4 ${expanding ? "animate-pulse" : ""}`} />
        {expanding ? "Rewriting…" : "Generate medium + long lectures"}
      </button>
      <button
        onClick={handleReset}
        disabled={resetting}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-border hover:bg-secondary disabled:opacity-50"
        data-testid="button-reset"
        title="Wipe your progress (keeps lectures and assignments)"
      >
        <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
        {resetting ? "Resetting…" : "Reset course"}
      </button>
      <Link href="/diagnostics"
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-secondary"
          }`}
          data-testid="button-diagnostic"
      >
          <Activity className="w-4 h-4" />
          Diagnostic
      </Link>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground md:flex-row">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <TopBar />
        {children}
      </main>
    </div>
  );
}
