# Finance — App Blueprint

A complete architectural blueprint for the *Finance* 4-week course. This document is the single reference for what the app does, how it's wired, and the contracts between pieces. For day-to-day commands and gotchas see `replit.md`.

---

## 1. Product summary

Finance is a self-paced, single-user, no-login web course covering the *ideas behind the formulas* of modern finance — the time value of money, financial statements, risk and return, and valuation and corporate finance. Each micro-lecture introduces one concept, grounds it in a real example from business or markets, and asks the student to write the defining formula *in symbols of their own* using the on-screen math keyboard.

The course runtime provides: lectures at three depths, section-scoped AI tutor, adaptive practice, AI-graded assignments, two-layer AI-authorship detection, and one-click diagnostics.

The product surface is three deployable artifacts in one pnpm monorepo:

| Artifact | Slug | Role |
| --- | --- | --- |
| `@workspace/api-server` | `api-server` | Express 5 API mounted at `/api`. Owns the DB, OpenAI calls, AI detection, grading, diagnostics. |
| `@workspace/qr-course` | `qr-course` | Student-facing React + Vite app. The actual course. |
| `@workspace/qr-course-demo` | `qr-course-demo` | A screencast-style product demo video, exported as MP4 from the preview pane. |

Shared contracts live in `lib/`:

- `lib/api-spec` — OpenAPI source of truth.
- `lib/api-zod` — generated Zod validators (used by the server).
- `lib/api-client-react` — generated React Query hooks (used by `qr-course`).
- `lib/db` — Drizzle schema + db client.

---

## 2. Curriculum (the ideas)

Source: `artifacts/api-server/src/lib/seed.ts`. 29 micro-lectures across four weeks. Each lecture teaches exactly one concept, anchors it in a real worked example, and ships a question that *requires* the student to write the key formula in symbolic form.

| Week | Theme | Concepts covered |
| --- | --- | --- |
| 1 | Foundations and the time value of money | What finance is & why it exists · the financial system & markets · money, interest & the time value of money · present value & future value · discounting cash flows · annuities & perpetuities · nominal vs. real rates & inflation |
| 2 | Financial statements and analysis | The three statements overview · the balance sheet ($A = L + E$) · the income statement · the statement of cash flows · ratio analysis & DuPont · working capital & liquidity · reading & interpreting annual reports |
| 3 | Risk, return, and markets | Risk & return fundamentals · measuring return (expected value, geometric vs. arithmetic) · measuring risk & volatility ($\sigma^2$, $\sigma$) · diversification & portfolio basics · the risk–return tradeoff & Sharpe ratio · the Capital Asset Pricing Model · market efficiency |
| 4 | Valuation and corporate finance | Bond valuation · stock valuation (Gordon growth) · capital budgeting & NPV · cost of capital & WACC · capital structure, leverage & Modigliani–Miller · corporate financing & dividend policy · financial intermediaries & institutions · capstone synthesis ($V = \sum E(CF_t)/(1+r)^t$) |

Assignment shape: 2 homeworks per week plus a graded checkpoint at the end of each week — a Week 1 test, the midterm at the end of Week 2, a Week 3 test, and the cumulative final at the end of Week 4 — 12 assignments total. Each problem prompt is *one symbolic formula* the student must compose.

---

## 3. Domain model (Postgres + Drizzle)

Source: `lib/db/src/schema/course.ts`.

```
topics ──< lectures              (one topic, one lecture per length)
topics ──< problems              (problems tagged to a topic for analytics)
assignments ──< problems         (homework / test / midterm / final)
assignments ──< attempts ──< answers
                                ↑ per-answer keystroke trace + AI scores
practice_sessions ──< practice_problems ──< practice_attempts
                                            ↑ adaptive difficulty session
```

Notable columns:

- `lectures.body` / `body_medium` / `body_long` — the Short / Medium / Long toggle is three pre-baked LLM rewrites of the same lecture. Only `body` is seeded; the on-demand `expand-lectures` job fills in the longer two.
- `answers.{keystrokeCount,eraseCount,bulkInsertCount,longestBulkInsertChars,rewriteSegments,durationMs}` — the **diachronic trace**, captured client-side from the textarea and submitted with the answer.
- `answers.{aiScore,aiFlagged,diachronicScore,diachronicFlagged,detectionRationale}` — frozen detection outcome at submission time.
- `practice_sessions.difficulty` (1–4, double) — adapts session-by-session based on streaks / accuracy.

Push schema with `pnpm --filter @workspace/db run push`.

### 3.1 Curriculum-swap reseed

`seedIfEmpty` maintains an `EXPECTED_TOPIC_SLUGS` set and a `REVISION_SENTINEL` constant (sentinel slug + a phrase that must appear in that lecture's body). On boot it compares the set of seeded topic slugs to the expected set, **and** verifies the sentinel phrase appears in the designated lecture:

- If both match: do nothing.
- If either differs (or the table is empty): wipe attempts, answers, practice, problems, assignments, lectures, topics in dependency order, then re-seed the full curriculum.

This is what lets a single content swap propagate cleanly on the next server start, without manual DB surgery.

---

## 4. API surface (OpenAPI-first)

Source: `lib/api-spec/openapi.yaml`. **Never** hand-edit `lib/api-zod/src/generated/*` or `lib/api-client-react/src/generated/*` — change the spec and run `pnpm --filter @workspace/api-spec run codegen`.

| Tag | Endpoints | Purpose |
| --- | --- | --- |
| `course` | `GET /course/overview`, `GET /course/weeks/{n}`, `GET /course/lectures/{id}` | Read the static course tree. Lectures return Short/Medium/Long bodies. |
| `tutor` | `POST /tutor/ask` (SSE), `GET /tutor/suggestions/{lectureId}` | Streaming AI tutor scoped to a lecture section. Suggestions are pre-generated starter questions. |
| `practice` | `POST /practice/sessions`, `POST /practice/sessions/{id}/next`, `POST /practice/sessions/{id}/attempts` | Adaptive practice: server generates the next problem, scoring it adjusts session `difficulty`. |
| `assignments` | `GET /assignments`, `GET /assignments/{id}`, `POST /assignments/{id}/attempt`, `PUT /assignments/{id}/attempts/{aid}/answers/{pid}`, `POST /assignments/{id}/attempts/{aid}/submit` | Homework / test flow. Submit triggers AI grade + detection per answer. |
| `analytics` | `GET /analytics/summary`, `GET /analytics/topics`, `GET /analytics/activity` | KPIs, topic mastery, recent activity. |
| `detection` | `POST /detection/scan` | Run AI + diachronic detection on an arbitrary text + trace. Used by the diagnostics page. |
| `diagnostics` | `GET /diagnostics/system`, `POST /diagnostics/synthetic-run`, `POST /diagnostics/expand-lectures`, `POST /diagnostics/reset` | Self-tests and seed maintenance. See §8. |

The submit endpoint's response schema (`AttemptResult`) bundles `score / total / percent / perProblem[] / detection[]` so the UI can render the AI-grade + detection verdict in one round-trip.

---

## 5. Server architecture

### 5.1 Layout

```
artifacts/api-server/src/
├── routes/
│   ├── course.ts          read-only course tree
│   ├── tutor.ts           SSE chat against a lecture section
│   ├── practice.ts        adaptive session lifecycle
│   ├── assignments.ts     attempt + grade + detect on submit
│   ├── analytics.ts       summary / topic mastery / activity
│   ├── detection.ts       /detection/scan passthrough
│   ├── diagnostics.ts     two diagnostics + seed maintenance
│   ├── health.ts          /healthz
│   └── index.ts           router mount
└── lib/
    ├── ai.ts              OpenAI client (Replit AI Integrations proxy)
    ├── detection.ts       GPTZero + heuristic + diachronic scoring
    ├── grading.ts         AI-graded answer with rationale
    ├── seed.ts            29-topic finance curriculum + auto-reseed
    └── logger.ts          singleton pino logger (req.log in routes)
```

### 5.2 Conventions

- **Validation:** every handler parses input with `safeParse` from `@workspace/api-zod` and re-`parse`s outputs before sending. Never trust the request body, never trust your own response.
- **Logging:** `req.log.info(...)` inside routes; singleton `logger` everywhere else. **Never** `console.log` in server code.
- **OpenAI:** all model calls go through `lib/ai.ts` (`chatText`, `chatJson`, `chatStream`, `FAST_MODEL`).
- **Errors:** thrown errors bubble to a global error handler that logs and returns `{ error: string }` with the right status. Detection failures are **non-fatal** — they return `null` and the caller falls back.

---

## 6. Symbolic answer harness — `MathKeyboard.tsx`

The student-facing app (`artifacts/qr-course`) ships a floating math keyboard that opens when the answer textarea focuses. Each tab targets one of the curricular families, including a dedicated **Finance** tab with the symbols most assignment answers need ($PV$, $FV$, $NPV$, $IRR$, $WACC$, $R_f$, $\beta$, $\sigma$, $\rho$, $E(R)$, the $\sum_{t=1}^{n}$ template, the $1/(1+r)^t$ discount factor, the $(E/V)r_e + (D/V)r_d(1-T)$ skeleton). Pressing a key inserts the corresponding LaTeX fragment at the textarea cursor.

The finance curriculum is, by design, a worst-case load for this keyboard: most assignment problems' canonical answers contain at least one symbol that requires it — summations, expectations, discount factors, Greek-letter risk parameters, the CAPM line, the WACC formula, the dividend-discount perpetuity, and so on.

What the harness stresses:

| Sub-system | Stress |
| --- | --- |
| Tab discoverability | Each lecture's problems push the student into a specific tab; if a tab is hidden or mislabeled, the student gets stuck. |
| Cursor insertion | LaTeX fragments must land at the current caret without smearing surrounding text. |
| Keystroke detection | Each keyboard press counts as a real keystroke in the diachronic trace; otherwise typed-answer behaviour reads as a paste. |
| LaTeX-aware grading | Canonical answers contain LaTeX; the grader must match `\sum` to `Σ`, `\beta` to `β`, `\sigma` to `σ`, `\rho` to `ρ`, `E(R_i) = R_f + \beta_i(E(R_m) - R_f)`, $\sum_{t=1}^{n} CF_t/(1+r)^t$, and the WACC string. |
| KaTeX rendering | Both lecture body and student answer-preview render the same LaTeX subset. |

---

## 7. AI detection — `artifacts/api-server/src/lib/detection.ts`

Detection runs **two independent functions** and bundles their outputs into one `DetectionOutcome`.

### 7.1 Static AI detection (GPTZero, with fallback)

Question answered: *"Was this text written by an LLM?"*

Pipeline:

1. **`gptzeroAiScore(text)`** — calls `POST https://api.gptzero.me/v2/predict/text` with `x-api-key: $GPTZERO_API_KEY`. Reads `documents[0].class_probabilities.ai` (plus half-weight of `mixed`), falls back to `completely_generated_prob`. Returns `null` on missing key, network failure, malformed response, or text shorter than 40 chars.
2. **`heuristicAiScore(text)`** — local zero-dependency scorer. Penalises long average sentence length plus presence of LLM tells (`delve`, `tapestry`, `leverag(e|ing)`, `in conclusion`, `it is important to note`, `plays a crucial/vital/pivotal role`, etc.).
3. **`llmAiScore(text)`** — secondary fallback in JSON-only mode.

Blend (`detect()`):

```
if GPTZero responded:           aiScore = 0.85 * gptzero + 0.15 * heuristic
elif LLM scorer responded:      aiScore = 0.60 * llm     + 0.40 * heuristic
else:                           aiScore = heuristic
```

`aiFlagged = aiScore >= 0.55`.

### 7.2 Diachronic detection (keystroke pattern)

Question answered: *"Did the student paste AI output and reword it to sound human?"*

`diachronicScore(text, trace)` reads a `TraceInput`:

```
{ keystrokeCount, eraseCount, bulkInsertCount?, longestBulkInsertChars?,
  rewriteSegments?, durationMs }
```

Penalty points:

| Signal | Penalty | Why |
| --- | --- | --- |
| `longestBulkInsertChars > 40` *or* `longestBulkInsertChars / textLen > 0.4` | +0.50 | One paste covers most of the answer. |
| `bulkInsertCount >= 2 && longestBulkInsert > 25` | +0.15 | Multiple paste events. |
| `keystrokeCount / textLen < 0.6` with `textLen > 30` | +0.30 | Far fewer keys than characters of output — paste-like. |
| `charsPerSecond > 12` with `textLen > 30` | +0.20 | Sustained typing speed no human freshman maintains. |
| `longestBulkInsert > 30 && rewriteSegments >= 2` | +0.15 | Big paste followed by reword passes — the giveaway pattern. |

Clamped to `[0, 1]`. `diachronicFlagged = diachronicScore >= 0.55`.

> ⚠️ The math keyboard interacts with diachronic detection: every keyboard press counts as a real `keydown` so the keystroke-to-output ratio stays human-shaped. If a future keyboard implementation inserts characters without dispatching keydowns, every symbolic answer will diachronically flag as paste — the keyboard *is* part of the detection contract.

---

## 8. Diagnostics surface

Two routes, one page. The page lives at `artifacts/qr-course/src/pages/Diagnostics.tsx`.

### 8.1 `GET /api/diagnostics/system`

Strict ordered checklist returning `{ ok, generatedAt, steps[] }`:

1. **Environment** — `DATABASE_URL` present.
2. **Database** — `SELECT 1` round-trip.
3. **Database** — course content seeded (full 29-topic finance curriculum, ≥1 lecture / assignment / problem).
4. **OpenAI** — fast-model chat completion returns non-empty text.
5. **OpenAI** — JSON mode returns `{ ok: true }`.
6. **Detection** — heuristic+scoring pipeline returns numbers for a benign sentence.
7. **AI detection** — pasted-style LLM-tell text **flags** as AI.
8. **GPTZero** — if `GPTZERO_API_KEY` is set, the real API responds and gives a non-null score.

### 8.2 `POST /api/diagnostics/synthetic-run`

Simulates a real student session against the live DB:

1. Create a practice session for a known topic.
2. Pull the first problem.
3. Submit a wrong answer, then a right one — confirm difficulty adjusts.
4. Create an assignment attempt, answer each problem, submit, and verify `AttemptResult` returns full `perProblem[]` + `detection[]`.
5. Hit analytics endpoints and confirm the new attempt is reflected.

### 8.3 Supporting routes (not in the diagnostics UI)

- `POST /api/diagnostics/expand-lectures` — generates `body_medium` / `body_long` for lectures missing them. Idempotent.
- `POST /api/diagnostics/reset` — wipes attempts / answers / practice for a clean demo. Does **not** drop course content.

---

## 9. Student app — `@workspace/qr-course`

React + Vite + Tailwind. Routes:

| Route | Page | What it does |
| --- | --- | --- |
| `/` | `Dashboard` | Assignments progress + Course Schedule + Recent Activity |
| `/weeks/:weekNumber` | `WeekView` | List of week's lectures and assignments |
| `/lectures/:lectureId` | `LectureView` | Lecture body + Short/Medium/Long toggle + right-rail tutor / practice |
| `/practice/topic/:topicId` | `TopicPractice` | Adaptive single-topic drill |
| `/assignments` | `Assignments` | All homework / tests / midterm / final |
| `/assignments/:id` | `AssignmentRunner` | Take + review an assignment; shows AI grade + detection per answer |
| `/analytics` | `Analytics` | KPIs, topic mastery table, recent activity |
| `/diagnostics` | `Diagnostics` | Operator self-test UI (see §8) |

All server data goes through the **generated** React Query hooks from `@workspace/api-client-react`. No fetch logic should be hand-written in components.

### 9.1 Diachronic trace capture

The answer `<textarea>` is wrapped in a hook (in the assignment runner / topic practice) that:

- Counts every `keydown` (excluding modifier-only) into `keystrokeCount`.
- Increments `eraseCount` on Backspace/Delete.
- On every `input` event, compares the new value to the previous: if the diff inserted ≥4 chars in one tick, that's a "bulk insert" — increment `bulkInsertCount` and update `longestBulkInsertChars`.
- Detects a "rewrite segment" when characters are erased mid-string and replaced with new ones.
- Stamps `durationMs` = (submit time − first focus time).

The trace is included in the answer `PUT` body and on `POST submit`, then stored verbatim on `answers` so detection is reproducible.

---

## 10. Demo video — `@workspace/qr-course-demo`

A **screencast-style** product walkthrough of the finance course UI, **not** a marketing reel. Built per the `video-js` skill: React + framer-motion, exported to MP4 from the preview pane via the browser recorder.

```
artifacts/qr-course-demo/src/components/video/
├── VideoTemplate.tsx        scene router + persistent sidebar + persistent cursor + background audio
├── VideoWithControls.tsx    iframe-only wrapper: scene jump, scene-lock, mute toggle
├── useSceneControls.ts      hook hiding jump/lock workarounds for useVideoPlayer
├── CursorPointer.tsx        animated SVG arrow
├── TypewriterText.tsx       char-by-char typing into inputs
├── StreamingText.tsx        word-by-word AI-response streaming
├── TypingIndicator.tsx      three pulsing dots
└── video_scenes/
    ├── Scene1.tsx           Dashboard → Week 1 "Foundations and the time value of money" (8s)
    ├── Scene2.tsx           Lecture 1.3 "Money, interest, and the time value of money": Short/Long toggle + Practice/Tutor tabs (8s)
    ├── Scene3.tsx           Tutor Q&A: "Why does compounding beat simple interest so dramatically over 30 years?" (12s)
    ├── Scene4.tsx           Analytics with finance KPIs + topic mastery click (10s)
    ├── Scene5.tsx           Topic Practice: wrong → adjust ↓ → right (CAPM formula typed via the math keyboard's Finance tab) → adjust ↑ (14s)
    └── Scene6.tsx           Assignments review with AI grade + AI-detection chip (10s)
```

`SCENE_DURATIONS` sums to **62 seconds**, looped. Background audio (`public/audio/bg_music.mp3`) is scene-synced via `SCENE_START_SEC`.

### 10.1 Key architectural rules

- **Sidebar persistence.** Sidebar lives in `VideoTemplate.tsx` outside `<AnimatePresence>`. Only the right-pane scene swaps.
- **Cursor persistence.** `CursorPointer` lives outside `<AnimatePresence>` and is driven by `setCursorPos / setIsClicking` passed into every scene.
- **The UI is rebuilt, not screenshotted.** Scenes use the real fonts and colours but every pixel is JSX.
- **`AnimatePresence` key = `currentSceneKey`** (NOT `baseSceneKey`). When scene-lock toggles `_r1` / `_r2`, both iterations must remount.
- **Mute wiring.** The mute toggle is declarative JSX (`<audio muted={muted}>`) only — it must not also re-seek `audio.currentTime`, or unmute restarts the scene's audio.

---

## 11. README contract

`replit.md` and `README.md` are the always-loaded project READMEs. They contain:

1. **Product overview** — what the course is and why this build exists (conceptual scaffolding behind the formulas of finance).
2. **Required env / secrets** — `DATABASE_URL`, `OPENAI_API_KEY`, `GPTZERO_API_KEY`, `SESSION_SECRET`.
3. **Curriculum summary** — the 29 concepts across four weeks.
4. **Technical features** — symbolic-answer harness, two-layer detection, diagnostics, auto-reseed, contract-first API.

If you change anything in this blueprint, update `README.md` and `replit.md` to match — they are the long-form and short-form views of the same truth.

---

## 12. End-to-end request example

A student submits Homework 3.6 (the Capital Asset Pricing Model). The full path:

1. Browser: `qr-course/src/pages/AssignmentRunner.tsx` calls the generated `useSubmitAttempt()` hook with `{ traces: { [problemId]: TraceInput } }`. Every $E(R_i)$, $R_f$, $\beta_i$, $E(R_m)$, $\sum$, and $1/(1+r)^t$ in the answer was inserted from the Finance tab of `MathKeyboard.tsx`, but each insert dispatched a real `keydown` so the trace looks human.
2. Generated client: `POST /api/assignments/{id}/attempts/{aid}/submit`, validated against `SubmitAttemptBody` Zod schema.
3. Express route (`routes/assignments.ts`):
   - Loads `attempt` + `answers` + `problems` from Drizzle.
   - For each answer: calls `gradeAnswer(problem, answer)` (OpenAI JSON mode, returns `{ correct, rationale }`) **and** `detect(answer.text, trace)` in parallel.
   - Writes `correct`, `aiScore`, `aiFlagged`, `diachronicScore`, `diachronicFlagged`, `detectionRationale` back onto each answer row.
   - Updates `attempts.status = "submitted"`, computes `scorePercent`.
4. Returns `AttemptResult` validated against the generated Zod schema.
5. Browser: `AssignmentRunner` renders per-problem cards with the AI grade rationale + a detection chip (`Human-written response · confidence 94%` or `AI-detected · 91%`).

Every layer in that chain (spec → server zod → server logic → client hook → client zod) is generated or validated from the same `openapi.yaml`. Don't introduce a parallel path.
