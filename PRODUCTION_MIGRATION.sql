-- ============================================================
--  Switch Captain — Production Setup SQL
--
--  Run this ONCE in Supabase → SQL Editor → New query
--  Steps:
--    1. Adds new columns to pipeline_candidates
--    2. Removes ALL demo data (users, captains, candidates, etc.)
--    3. After running → register your own ops account in the app
-- ============================================================

-- ─── 1. ADD NEW COLUMNS (safe to re-run) ─────────────────────
ALTER TABLE pipeline_candidates
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS joining_date    DATE,
  ADD COLUMN IF NOT EXISTS linked_job_id   TEXT;

-- ─── 2. CLEAR ALL DEMO DATA ──────────────────────────────────
-- Order matters: delete child rows before parent rows

DELETE FROM post_reactions;
DELETE FROM social_comments;
DELETE FROM social_posts;
DELETE FROM social_members;
DELETE FROM payout_requests;
DELETE FROM pipeline_candidates;
DELETE FROM notifications;
DELETE FROM jobs;
DELETE FROM app_users;      -- removes ALL demo login accounts
DELETE FROM captains;       -- removes Shourya Pandey and any test captains

-- ─── 3. VERIFY ───────────────────────────────────────────────
SELECT 'captains'           AS table_name, COUNT(*) AS rows FROM captains
UNION ALL SELECT 'app_users',              COUNT(*) FROM app_users
UNION ALL SELECT 'pipeline_candidates',    COUNT(*) FROM pipeline_candidates
UNION ALL SELECT 'jobs',                   COUNT(*) FROM jobs;
-- All counts should be 0 ✓
