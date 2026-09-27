# Moving an existing Economics database to Precalculus

The app does **not** rewrite economics lessons or student progress as precalculus. If a database still has the imported Economics course, the API refuses to start instead of serving mislabeled data.

To switch that database:

1. Stop the API, and take a database backup using your database provider's normal backup/export feature.
2. Review `archive-economics-course.sql`. It archives the original course and all course-linked attempts, answers, practice sessions, scores, and activity into `course_archive.economics_*` tables. Historical economics progress remains queryable in the archive, **but is no longer visible in the Precalculus UI**. Precalculus starts with fresh progress because the two curricula are not equivalent.
3. If that behavior is acceptable, run the complete SQL file on the database, for example with `psql -v ON_ERROR_STOP=1 -d "$DATABASE_URL" -f artifacts/api-server/scripts/archive-economics-course.sql` from a trusted environment. Do not paste a database URL into chat or log it.
4. Restart the API. It seeds the 29 Precalculus lessons and four graded assignments into the now-empty active tables. Verify `/api/course/overview` and check the archived row counts before discarding any separate backup.

The SQL is an explicit one-time operation, never part of normal startup. It runs in a transaction, refuses empty or already-Precalculus databases, and refuses to overwrite an existing archive. A failing query rolls back all changes. Visitor analytics are not reset.