---
name: Anonymous access model
description: The no-account, unlimited-access decision and per-visitor data-scoping rules for the finance course
---

The course intentionally has no login, account system, or feature quota.

**Why:** The owner explicitly requires every course, AI, diagnostic, and analytics feature to work without authentication or usage limits.

**How to apply:** Do not add sign-in prompts, authentication middleware, account-only UI, or guest AI metering. Keep diagnostics, visitor totals, and all AI routes openly functional.

- **Every request still has an anonymous identity.** The `identify` middleware stamps `req.userId` with a `g_<uuid>` cookie ID (`fin_guest`). This is not login; it only keeps each browser's progress and analytics separate. All progress tables (`attempts`, `practice_sessions`, `practice_attempts`, `practice_assignments`) carry `user_id` and every read/write MUST be scoped by it.
  **Why:** removing auth exposed unscoped course-overview/analytics/practice queries; a review also found a session IDOR (`/practice/sessions/:id/*` loaded by id only).
  **How to apply:** any new route that touches progress data must filter by `getUserId(req)`; load parent rows (sessions, attempts) with `and(id, userId)` and 404 on mismatch.
- pdfkit/fontkit must stay in the esbuild `external` list in api-server's build.mjs (bundling breaks their font-data file reads).
- Schema changes were applied with drizzle push to the shared Neon DB; if prod ever uses a separate DB, push there before publishing.
