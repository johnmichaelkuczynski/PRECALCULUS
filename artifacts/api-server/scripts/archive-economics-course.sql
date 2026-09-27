-- One-time, operator-approved transition for an imported Economics database.
-- Stop the API before running this file. It copies ALL course and student progress
-- tables into a separate schema, then empties only the active course tables.
-- It does not alter visitor analytics. Restart the API afterward to seed Precalculus.
-- Run against a separately backed-up database; do not run against Precalculus.
-- Execute with ON_ERROR_STOP=1 in psql, or in a SQL editor that runs the whole file.
BEGIN;

CREATE SCHEMA IF NOT EXISTS course_archive;

DO $$
DECLARE
  table_name text;
  archive_tables text[] := ARRAY[
    'topics', 'lectures', 'assignments', 'problems', 'attempts', 'answers',
    'practice_sessions', 'practice_problems', 'practice_attempts',
    'practice_assignments', 'practice_assignment_problems',
    'practice_assignment_answers', 'feedback_messages', 'user_topic_stats',
    'activity_log'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.topics) THEN
    RAISE EXCEPTION 'No existing course to archive';
  END IF;
  IF EXISTS (SELECT 1 FROM public.topics WHERE slug = 'real-numbers-intervals') THEN
    RAISE EXCEPTION 'Precalculus content already exists; refusing to archive a mixed/new course';
  END IF;
  FOREACH table_name IN ARRAY archive_tables LOOP
    IF to_regclass(format('course_archive.%s', 'economics_' || table_name)) IS NOT NULL THEN
      RAISE EXCEPTION 'Archive already exists for %. Stop and inspect it before retrying', table_name;
    END IF;
    EXECUTE format(
      'CREATE TABLE course_archive.%I AS TABLE public.%I WITH DATA',
      'economics_' || table_name, table_name
    );
  END LOOP;
END $$;

-- The archive retains every original ID, answer, grade, trace, and activity log.
-- A single TRUNCATE lists all FK-connected course tables; no CASCADE is used.
-- If an unlisted table references course data, PostgreSQL aborts and rolls back
-- the entire transaction instead of silently erasing that table.
TRUNCATE TABLE
  public.answers,
  public.feedback_messages,
  public.practice_assignment_answers,
  public.practice_assignment_problems,
  public.practice_assignments,
  public.practice_attempts,
  public.practice_problems,
  public.practice_sessions,
  public.attempts,
  public.problems,
  public.lectures,
  public.assignments,
  public.user_topic_stats,
  public.activity_log,
  public.topics
RESTART IDENTITY;

COMMIT;