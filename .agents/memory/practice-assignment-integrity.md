---
name: Practice-assignment integrity rules
description: Non-overlap, per-user authz, and idempotency invariants for the qr-course practice/graded assignment system.
---

# Practice-assignment integrity rules

Three invariants the practice/graded system must always uphold. Each was a real defect caught in review; keep them in lockstep with any future change to generation, attempts, or submit.

## 1. No-overlap is deterministic, never LLM-trusted
Generated practice problems must never repeat a graded prompt or a prior practice prompt for the same user+source.
**Why:** the LLM prompt alone ("don't repeat these") is not a guarantee, and capping the prior-prompt history (the old `.limit(60)`) let old prompts resurface.
**How to apply:** build a key set from ALL graded + ALL prior prompts via a `normalizePrompt()` collapse, reject any LLM problem (and any within-batch dup) whose key collides, and have the fallback synthesize randomized problems checked against the same set. Send only a recent slice to the LLM as a hint, but exclude against the full set.

## 2. Every attempt query is user-scoped
Graded `attempts` (and practice assignments) belong to one Clerk user; cross-user read/write/submit is an IDOR.
**Why:** `requireAuth` only proves *a* user is logged in — it does not scope rows. Loading an attempt by id alone leaks/edits other users' work and corrupts the per-user profile that readiness depends on.
**How to apply:** every attempt select/update must include `eq(attemptsTable.userId, getUserId(req))` — list status/best, start-resume, loadAttempt, GET/PUT/submit. Note `attempts.userId` is nullable (legacy rows), so scoping naturally hides pre-auth anonymous attempts.

## 3. Submit is idempotent
Submitting an already-submitted set must not re-grade or re-log.
**Why:** re-running `recordTopicResult` + `logActivity` inflates `user_topic_stats` and activity-driven readiness signals on every resubmit/double-click.
**How to apply:** guard `if (status !== "in_progress")` — practice submit returns the reconstructed stored result; graded submit returns 400. Reconstruct results from persisted answer rows, never by re-grading.
