-- ============================================================
--  Switch Captain Platform — Full Supabase SQL Setup
--  Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- ─── 1. CAPTAINS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS captains (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  mobile      TEXT UNIQUE NOT NULL,
  upi_id      TEXT DEFAULT '',
  joined_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. APP USERS TABLE (Login credentials) ─────────────────────
CREATE TABLE IF NOT EXISTS app_users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('captain', 'ops')),
  captain_id  TEXT REFERENCES captains(id) ON DELETE SET NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. PIPELINE CANDIDATES TABLE ───────────────────────────────
CREATE TABLE IF NOT EXISTS pipeline_candidates (
  id                   TEXT PRIMARY KEY,
  name                 TEXT NOT NULL,
  mobile               TEXT NOT NULL,
  job_type             TEXT NOT NULL,
  location             TEXT NOT NULL,
  current_stage        TEXT NOT NULL CHECK (current_stage IN ('Sourced','Screening','Interviewed','Offered','Placed')),
  referred_by          TEXT REFERENCES captains(id) ON DELETE SET NULL,
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  placed_at            TIMESTAMPTZ,
  guarantee_expires_at TIMESTAMPTZ,
  replacement_needed   BOOLEAN DEFAULT FALSE,
  replacement_for_id   TEXT,
  flagged              BOOLEAN DEFAULT FALSE,
  archived             BOOLEAN DEFAULT FALSE,
  payout_amount        INTEGER DEFAULT 300,
  payout_status        TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending','confirmed','paid')),
  payout_paid_at       TIMESTAMPTZ,
  timeline             JSONB DEFAULT '[]',
  notes                JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. JOBS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id            TEXT PRIMARY KEY,
  role          TEXT NOT NULL,
  location      TEXT NOT NULL,
  salary_range  TEXT,
  urgency       TEXT DEFAULT 'medium' CHECK (urgency IN ('low','medium','high')),
  posted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active        BOOLEAN DEFAULT TRUE,
  description   TEXT DEFAULT '',
  openings      INTEGER DEFAULT 1,
  filled        INTEGER DEFAULT 0
);

-- ─── 5. NOTIFICATIONS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read          BOOLEAN DEFAULT FALSE,
  candidate_id  TEXT,
  for_role      TEXT DEFAULT 'all'
);

-- ────────────────────────────────────────────────────────────────
-- ENABLE REALTIME — safely skip tables already in publication
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['pipeline_candidates','captains','notifications','app_users','jobs']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY — allow all from anon key (tighten later)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE captains             ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_candidates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- Drop policies first if they exist (safe to re-run)
DROP POLICY IF EXISTS "allow_all_captains"            ON captains;
DROP POLICY IF EXISTS "allow_all_app_users"           ON app_users;
DROP POLICY IF EXISTS "allow_all_pipeline_candidates" ON pipeline_candidates;
DROP POLICY IF EXISTS "allow_all_jobs"                ON jobs;
DROP POLICY IF EXISTS "allow_all_notifications"       ON notifications;

CREATE POLICY "allow_all_captains"            ON captains            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_app_users"           ON app_users           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pipeline_candidates" ON pipeline_candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_jobs"                ON jobs                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications"       ON notifications       FOR ALL USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────
-- SEED: Shourya Pandey captain
-- ────────────────────────────────────────────────────────────────
INSERT INTO captains (id, name, mobile, upi_id, joined_at, active)
VALUES ('captain_shourya_001', 'Shourya Pandey', '9000000000', 'shourya@paytm', CURRENT_DATE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- SEED: Login accounts
-- shourya123  → c2hvdXJ5YTEyMw==
-- Admin@123   → QWRtaW5AMTIz
-- Change passwords after first login!
-- ────────────────────────────────────────────────────────────────
INSERT INTO app_users (phone, password, name, role, captain_id)
VALUES
  ('9205617375', 'c2hvdXJ5YTEyMw==',  'Shourya Pandey', 'captain', 'captain_shourya_001'),
  ('9205617376', 'QWRtaW5AMTIz',       'Admin',          'ops',      NULL)
ON CONFLICT (phone) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- REASSIGN: Move ops_001 candidates to Shourya Pandey
-- Also reassigns any dummy captain_001..005 leftovers
-- ────────────────────────────────────────────────────────────────
UPDATE pipeline_candidates
SET referred_by = 'captain_shourya_001'
WHERE referred_by = 'ops_001'
   OR referred_by IN ('captain_001','captain_002','captain_003','captain_004','captain_005')
   OR referred_by IS NULL;

-- Also fix the legacy candidates table if it still exists
UPDATE candidates
SET added_by = '255dd2ab-cd76-4838-a0a1-8028a6fdf3a1'  -- Admin UUID in legacy table
WHERE added_by IS NULL;


-- ────────────────────────────────────────────────────────────────
-- VERIFY: Check which tables are in realtime publication
-- ────────────────────────────────────────────────────────────────
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
