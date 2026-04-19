-- ============================================================
--  Switch Captain — Production Migration
--  Run this in Supabase SQL Editor to go live:
--    1. Adds new columns to pipeline_candidates
--    2. Clears ALL demo/seed data
--    3. Sets up realtime publication
-- ============================================================

-- ─── 1. ADD NEW COLUMNS ──────────────────────────────────────
ALTER TABLE pipeline_candidates
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS joining_date    DATE,
  ADD COLUMN IF NOT EXISTS linked_job_id   TEXT;

-- ─── 2. ENABLE REALTIME ON ALL TABLES ────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'pipeline_candidates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_candidates;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'captains'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE captains;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_posts;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_comments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_members;
  END IF;
END $$;

-- ─── 3. CLEAR ALL DEMO DATA ──────────────────────────────────
-- Order matters (foreign keys): children before parents

-- Social layer
DELETE FROM post_reactions;
DELETE FROM social_comments;
DELETE FROM social_posts;
DELETE FROM social_members;

-- Pipeline layer
DELETE FROM payout_requests;
DELETE FROM pipeline_candidates;
DELETE FROM notifications;
DELETE FROM jobs;

-- Auth layer (clears all demo users/captains — add real ones after)
DELETE FROM app_users;
DELETE FROM captains;

-- ─── 4. CREATE YOUR FIRST OPS ACCOUNT ────────────────────────
-- Replace the values below with real credentials before running.
-- Password is base64(encodeURIComponent(password)) — generate with:
--   btoa(encodeURIComponent('yourpassword'))  in browser console
--
-- INSERT INTO app_users (phone, password, name, role, captain_id, active)
-- VALUES ('9XXXXXXXXXX', '<base64_password>', 'Your Name', 'ops', NULL, TRUE);

-- ─── 5. VERIFY ───────────────────────────────────────────────
SELECT 'captains'            AS tbl, COUNT(*) FROM captains
UNION ALL SELECT 'app_users',             COUNT(*) FROM app_users
UNION ALL SELECT 'pipeline_candidates',   COUNT(*) FROM pipeline_candidates
UNION ALL SELECT 'jobs',                  COUNT(*) FROM jobs
UNION ALL SELECT 'social_posts',          COUNT(*) FROM social_posts;
