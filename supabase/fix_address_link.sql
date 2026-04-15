-- Fix: make address_link optional (allow empty/null values)
-- Run this in Supabase SQL Editor

ALTER TABLE public.pgs
  ALTER COLUMN address_link SET DEFAULT '',
  ALTER COLUMN address_link DROP NOT NULL;

-- Also fix candidates table if job_id / doc_received columns are missing
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doc_received BOOLEAN NOT NULL DEFAULT FALSE;

-- Add missing index
CREATE INDEX IF NOT EXISTS idx_pgs_added_by ON public.pgs(added_by);

-- Make sure admins can manage all pgs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pgs' AND policyname = 'Admins manage all pgs'
  ) THEN
    CREATE POLICY "Admins manage all pgs"
      ON public.pgs FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND is_admin = TRUE)
      );
  END IF;
END $$;
