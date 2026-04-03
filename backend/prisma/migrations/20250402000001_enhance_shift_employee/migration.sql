-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: enhance_shift_employee
-- Adds: is_next_day, department_id FK to shift
-- Adds: working_mode, shift_id to employee
-- Creates: employee_shift_assignment table
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Shift enhancements ────────────────────────────────────────────────────────

ALTER TABLE "shift"
  ADD COLUMN IF NOT EXISTS "is_next_day"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "department_id"  INTEGER REFERENCES "department"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "shift_department_id_idx" ON "shift"("department_id");

-- ── Employee enhancements ─────────────────────────────────────────────────────

ALTER TABLE "employee"
  ADD COLUMN IF NOT EXISTS "working_mode" VARCHAR(10) NOT NULL DEFAULT 'FIXED',
  ADD COLUMN IF NOT EXISTS "shift_id"     INTEGER REFERENCES "shift"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "employee_shift_id_idx" ON "employee"("shift_id");

-- ── Employee Shift Assignment (history table) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "employee_shift_assignment" (
  "id"             SERIAL       PRIMARY KEY,
  "employee_id"    INTEGER      NOT NULL REFERENCES "employee"("id") ON DELETE CASCADE,
  "shift_id"       INTEGER      NOT NULL REFERENCES "shift"("id")    ON DELETE CASCADE,
  "effective_date" DATE         NOT NULL,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "esa_employee_id_idx" ON "employee_shift_assignment"("employee_id");
CREATE INDEX IF NOT EXISTS "esa_shift_id_idx"    ON "employee_shift_assignment"("shift_id");
