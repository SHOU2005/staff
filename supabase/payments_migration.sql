-- ─── PAYMENTS TABLE ───────────────────────────────────────────
-- Run this in your Supabase SQL Editor to add payment tracking

CREATE TABLE IF NOT EXISTS public.payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id      UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name    TEXT NOT NULL,
  candidate_phone   TEXT NOT NULL,
  pg_name           TEXT NOT NULL DEFAULT 'Unknown',
  pg_phone          TEXT NOT NULL DEFAULT '',
  amount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'Pending',  -- 'Pending' | 'Received'
  received_at       TIMESTAMPTZ,
  notes             TEXT,
  joining_date      DATE,
  staff_id          UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payments_staff ON public.payments(staff_id);
CREATE INDEX IF NOT EXISTS idx_payments_candidate ON public.payments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see own payments"
  ON public.payments FOR SELECT
  USING (staff_id = auth.uid());

CREATE POLICY "Staff insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Staff update own payments"
  ON public.payments FOR UPDATE
  USING (staff_id = auth.uid());

CREATE POLICY "Admins see all payments"
  ON public.payments FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.staff WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  END IF;
END $$;
