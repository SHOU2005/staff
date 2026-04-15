-- ─── FIX: PGS table RLS policies ─────────────────────────────
-- Run this in Supabase SQL Editor → New Query → Run

-- 1. Drop conflicting policies
DROP POLICY IF EXISTS "Staff insert own pgs" ON public.pgs;
DROP POLICY IF EXISTS "Staff update own pgs" ON public.pgs;
DROP POLICY IF EXISTS "Staff see all pgs" ON public.pgs;
DROP POLICY IF EXISTS "Admins manage all pgs" ON public.pgs;

-- 2. Recreate clean policies
CREATE POLICY "pgs_select_all"
  ON public.pgs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pgs_insert"
  ON public.pgs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "pgs_update"
  ON public.pgs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "pgs_delete"
  ON public.pgs FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 3. Also fix jobs table policies
DROP POLICY IF EXISTS "Staff insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Staff update own jobs" ON public.jobs;

CREATE POLICY "jobs_insert"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "jobs_update"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
