-- Add location tracking columns to captains table
ALTER TABLE captains
  ADD COLUMN IF NOT EXISTS last_lat          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_lng          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS last_location_at  TIMESTAMPTZ;
