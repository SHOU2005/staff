-- ============================================================
-- SWITCH STAFF SYSTEM – Supabase SQL Schema
-- Run this in the Supabase SQL Editor for your project
-- ============================================================

-- ─── 1. STAFF TABLE ──────────────────────────────────────────
-- NOTE: This table mirrors auth.users (id is the auth UID)
CREATE TABLE IF NOT EXISTS public.staff (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT UNIQUE NOT NULL,
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. CANDIDATES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT UNIQUE NOT NULL,
  role            TEXT NOT NULL,
  location        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Interested',
  joining_date    DATE,
  follow_up_date  DATE,
  notes           TEXT,
  added_by        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. DAILY WORK TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_work (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  calls_done  INTEGER NOT NULL DEFAULT 0,
  posts_done  INTEGER NOT NULL DEFAULT 0,
  leads_added INTEGER NOT NULL DEFAULT 0,
  UNIQUE(staff_id, date)
);

-- ─── 4. INDEXES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_candidates_added_by    ON public.candidates(added_by);
CREATE INDEX IF NOT EXISTS idx_candidates_status      ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_joining     ON public.candidates(joining_date);
CREATE INDEX IF NOT EXISTS idx_candidates_followup    ON public.candidates(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_staff_date  ON public.daily_work(staff_id, date);

-- ─── 5. ROW LEVEL SECURITY ───────────────────────────────────
ALTER TABLE public.staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_work  ENABLE ROW LEVEL SECURITY;

-- ── staff: each user can read their own profile ──
CREATE POLICY "Staff can read own profile"
  ON public.staff FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff can update own profile"
  ON public.staff FOR UPDATE
  USING (auth.uid() = id);

-- Admins see all staff
CREATE POLICY "Admins can read all staff"
  ON public.staff FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ── candidates: staff see only their own candidates ──
CREATE POLICY "Staff see own candidates"
  ON public.candidates FOR SELECT
  USING (added_by = auth.uid());

CREATE POLICY "Staff insert own candidates"
  ON public.candidates FOR INSERT
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "Staff update own candidates"
  ON public.candidates FOR UPDATE
  USING (added_by = auth.uid());

CREATE POLICY "Staff delete own candidates"
  ON public.candidates FOR DELETE
  USING (added_by = auth.uid());

-- Admins see all candidates
CREATE POLICY "Admins see all candidates"
  ON public.candidates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ── daily_work: staff see only their own records ──
CREATE POLICY "Staff see own daily work"
  ON public.daily_work FOR SELECT
  USING (staff_id = auth.uid());

CREATE POLICY "Staff insert own daily work"
  ON public.daily_work FOR INSERT
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff update own daily work"
  ON public.daily_work FOR UPDATE
  USING (staff_id = auth.uid());

-- Admins see all daily work
CREATE POLICY "Admins see all daily work"
  ON public.daily_work FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ─── 6. REALTIME ─────────────────────────────────────────────
-- Enable realtime on all three tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'candidates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'daily_work') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_work;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'staff') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.staff;
  END IF;
END $$;

-- ─── 7. TRIGGER: Auto-create staff profile on signup ─────────
-- When a new user signs up in Auth, auto-create a staff row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.staff (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Staff'),
    -- Phone number is stored as email: 919876543210@switch.staff -> extract the number
    SPLIT_PART(NEW.email, '@', 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 8. PGS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pgs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  owner_name      TEXT NOT NULL,
  owner_phone     TEXT NOT NULL,
  address_link    TEXT NOT NULL,
  added_by        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see all pgs"
  ON public.pgs FOR SELECT
  USING (true);

CREATE POLICY "Staff insert own pgs"
  ON public.pgs FOR INSERT
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "Staff update own pgs"
  ON public.pgs FOR UPDATE
  USING (added_by = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pgs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pgs;
  END IF;
END $$;

-- ─── 9. JOBS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  company         TEXT,
  location        TEXT,
  salary          TEXT,
  pg_id           UUID REFERENCES public.pgs(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'Open',
  added_by        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see all open jobs"
  ON public.jobs FOR SELECT
  USING (status = 'Open' OR added_by = auth.uid());

CREATE POLICY "Staff insert own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (added_by = auth.uid());

CREATE POLICY "Staff update own jobs"
  ON public.jobs FOR UPDATE
  USING (added_by = auth.uid());

CREATE POLICY "Admins see all jobs"
  ON public.jobs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND is_admin = TRUE)
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'jobs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
  END IF;
END $$;

-- ============================================================
-- HOW TO ADD STAFF (run for each new team member):
--
-- Step 1: Insert auth user via Supabase Auth UI or:
--   SELECT supabase_admin.create_user(
--     email := '919876543210@switch.staff',
--     password := 'YourSecurePassword123',
--     user_metadata := '{"name": "Rahul Sharma"}'
--   );
--
-- Step 2 (optional, make admin):
--   UPDATE public.staff SET is_admin = TRUE WHERE phone = '919876543210';
--
-- The trigger above will auto-create the staff row on signup.
-- ============================================================
