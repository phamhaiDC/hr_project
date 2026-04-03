-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Enhance shift table for Working Shift module
--   1. Rename is_next_day  →  is_cross_day
--   2. Add code (unique), is_active columns
--   3. Back-fill codes for existing rows
--   4. Seed "Standard Working Shift" (global default for FIXED departments)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename column
ALTER TABLE shift RENAME COLUMN is_next_day TO is_cross_day;

-- 2. New columns
ALTER TABLE shift ADD COLUMN IF NOT EXISTS code       VARCHAR(100);
ALTER TABLE shift ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- 3. Back-fill codes for rows that have none yet
UPDATE shift
SET code = UPPER(REGEXP_REPLACE(name, '[^A-Za-z0-9]', '_', 'g')) || '_' || id::text
WHERE code IS NULL;

-- 4. Make code NOT NULL and add unique constraint (idempotent)
ALTER TABLE shift ALTER COLUMN code SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shift_code_key' AND conrelid = 'shift'::regclass
  ) THEN
    ALTER TABLE shift ADD CONSTRAINT shift_code_key UNIQUE (code);
  END IF;
END $$;

-- 5. Insert global "Standard Working Shift" (FIXED departments default)
INSERT INTO shift (name, code, start_time, end_time, is_cross_day,
                   break_minutes, grace_late_minutes, grace_early_minutes,
                   is_default, department_id, is_active)
VALUES ('Standard Working Shift', 'STANDARD', '08:00', '18:00', false,
        60, 15, 15, true, NULL, true)
ON CONFLICT (code) DO NOTHING;
