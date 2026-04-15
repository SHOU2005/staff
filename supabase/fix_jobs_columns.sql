-- ─── FIX: Add missing columns to jobs table ──────────────────
-- Run this in Supabase SQL Editor → New Query → Run

-- 1. Add pg_id column if missing
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS pg_id UUID REFERENCES public.pgs(id) ON DELETE SET NULL;

-- 2. Add added_by column if missing  
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES public.staff(id) ON DELETE CASCADE;

-- 3. Fix any null added_by rows with first staff member
UPDATE public.jobs 
  SET added_by = (SELECT id FROM public.staff ORDER BY created_at LIMIT 1) 
  WHERE added_by IS NULL;

-- 4. Add salary column if missing
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS salary TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Open';

-- 5. Refresh the schema cache (important!)
NOTIFY pgrst, 'reload schema';
