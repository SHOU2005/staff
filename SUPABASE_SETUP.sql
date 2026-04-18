-- ============================================================
--  Switch Captain Platform — Complete Supabase SQL v3
--  Run this ENTIRE script in Supabase SQL Editor (safe to re-run)
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

-- ─── 2. APP USERS TABLE ────────────────────────────────────────
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

-- ─── 3. PIPELINE CANDIDATES TABLE ──────────────────────────────
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

-- ─── 4. JOBS TABLE ─────────────────────────────────────────────
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

-- ─── 5. NOTIFICATIONS TABLE ────────────────────────────────────
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

-- ─── 6. PAYOUT REQUESTS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_requests (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  captain_id    TEXT NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  captain_name  TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  upi_id        TEXT NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','paid')),
  processed_at  TIMESTAMPTZ,
  processed_by  TEXT,
  note          TEXT DEFAULT '',
  candidate_ids JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. SOCIAL MEMBERS TABLE ───────────────────────────────────
-- Every candidate auto-gets a social profile. Captains and ops too.
CREATE TABLE IF NOT EXISTS social_members (
  id                  TEXT PRIMARY KEY,   -- mem_<candidateId> or mem_cap_<captainId>
  linked_candidate_id TEXT REFERENCES pipeline_candidates(id) ON DELETE SET NULL,
  linked_captain_id   TEXT REFERENCES captains(id) ON DELETE SET NULL,
  reg_number          TEXT UNIQUE NOT NULL,  -- SW-037001, SW-CAP-001, etc.
  name                TEXT NOT NULL,
  job_type            TEXT DEFAULT '',
  city                TEXT DEFAULT '',
  state               TEXT DEFAULT 'Haryana',
  bio                 TEXT DEFAULT '',
  bio_hindi           TEXT DEFAULT '',
  role                TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('worker','captain','ops')),
  badges              JSONB DEFAULT '[]',
  hiring_stage        TEXT DEFAULT '',
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  post_count          INTEGER DEFAULT 0,
  is_active           BOOLEAN DEFAULT TRUE,
  is_muted            BOOLEAN DEFAULT FALSE,
  is_verified         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 8. SOCIAL POSTS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
  id                TEXT PRIMARY KEY,
  author_id         TEXT NOT NULL REFERENCES social_members(id) ON DELETE CASCADE,
  author_name       TEXT NOT NULL,
  author_reg_number TEXT NOT NULL,
  author_role       TEXT NOT NULL CHECK (author_role IN ('worker','captain','ops')),
  type              TEXT NOT NULL CHECK (type IN ('job_available','looking_for_job','tip','announcement','success_story','official')),
  content           TEXT NOT NULL,
  photo             TEXT,   -- base64 or URL
  job_details       JSONB,  -- { role, location, salary, contactWhatsApp }
  reactions         JSONB NOT NULL DEFAULT '{"like":0,"fire":0,"clap":0}',
  comment_count     INTEGER NOT NULL DEFAULT 0,
  pinned            BOOLEAN NOT NULL DEFAULT FALSE,
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  reported          BOOLEAN NOT NULL DEFAULT FALSE,
  report_count      INTEGER NOT NULL DEFAULT 0,
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 9. SOCIAL COMMENTS TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS social_comments (
  id                TEXT PRIMARY KEY,
  post_id           TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  author_id         TEXT NOT NULL REFERENCES social_members(id) ON DELETE CASCADE,
  author_name       TEXT NOT NULL,
  author_reg_number TEXT NOT NULL,
  content           TEXT NOT NULL,
  posted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  likes             INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 10. POST REACTIONS TABLE (per-user) ───────────────────────
CREATE TABLE IF NOT EXISTS post_reactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     TEXT NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  member_id   TEXT NOT NULL REFERENCES social_members(id) ON DELETE CASCADE,
  reaction    TEXT NOT NULL CHECK (reaction IN ('like','fire','clap')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, member_id)
);

-- ─── 11. PRIVATE COMMUNITIES TABLE (Captain talent pools) ──────
CREATE TABLE IF NOT EXISTS private_communities (
  id            TEXT PRIMARY KEY,
  captain_id    TEXT NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  captain_name  TEXT NOT NULL,
  name          TEXT NOT NULL,
  cover_color   TEXT DEFAULT '#1A7A4A',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pinned_post_id TEXT,
  member_ids    JSONB DEFAULT '[]'
);

-- ─── 12. BROADCASTS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcasts (
  id              TEXT PRIMARY KEY,
  from_captain_id TEXT NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  community_id    TEXT NOT NULL,
  job_title       TEXT NOT NULL,
  location        TEXT NOT NULL,
  salary          TEXT,
  message         TEXT,
  target_filter   JSONB DEFAULT '{}',
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen_by         JSONB DEFAULT '[]',
  responded_by    JSONB DEFAULT '[]'
);

-- ─── 13. POLLS TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polls (
  id           TEXT PRIMARY KEY,
  community_id TEXT NOT NULL,
  question     TEXT NOT NULL DEFAULT 'Who is available for work this week?',
  options      JSONB NOT NULL DEFAULT '[]',
  responses    JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ────────────────────────────────────────────────────────────────
-- ENABLE REALTIME — all tables
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pipeline_candidates','captains','notifications','app_users','jobs',
    'payout_requests','social_members','social_posts','social_comments',
    'post_reactions','private_communities','broadcasts','polls'
  ]
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
-- ROW LEVEL SECURITY — open for anon key (tighten later)
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'captains','app_users','pipeline_candidates','jobs','notifications',
    'payout_requests','social_members','social_posts','social_comments',
    'post_reactions','private_communities','broadcasts','polls'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- SEED: Shourya Pandey captain
-- ────────────────────────────────────────────────────────────────
INSERT INTO captains (id, name, mobile, upi_id, joined_at, active)
VALUES ('captain_shourya_001', 'Shourya Pandey', '9000000000', 'shourya@paytm', CURRENT_DATE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Login accounts (passwords: shourya123 / Admin@123)
INSERT INTO app_users (phone, password, name, role, captain_id)
VALUES
  ('9205617375', 'c2hvdXJ5YTEyMw==',  'Shourya Pandey', 'captain', 'captain_shourya_001'),
  ('9205617376', 'QWRtaW5AMTIz',       'Admin',          'ops',      NULL)
ON CONFLICT (phone) DO NOTHING;

-- SW-OPS-001 ops social profile
INSERT INTO social_members (id, linked_candidate_id, linked_captain_id, reg_number, name, job_type, city, state, bio, bio_hindi, role, badges, is_verified)
VALUES (
  'mem_ops_001', NULL, NULL, 'SW-OPS-001', 'Switch Official',
  'Operations', 'Gurgaon', 'Haryana',
  'Official Switch Operations team. Helping connect workers and employers.',
  'आधिकारिक स्विच टीम। श्रमिकों और नियोक्ताओं को जोड़ने में मदद करती है।',
  'ops', '["verified","official"]', TRUE
) ON CONFLICT (id) DO NOTHING;

-- REASSIGN ops_001 → shourya
UPDATE pipeline_candidates
SET referred_by = 'captain_shourya_001'
WHERE referred_by = 'ops_001'
   OR referred_by IN ('captain_001','captain_002','captain_003','captain_004','captain_005')
   OR referred_by IS NULL;

-- ────────────────────────────────────────────────────────────────
-- VERIFY realtime tables
-- ────────────────────────────────────────────────────────────────
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
