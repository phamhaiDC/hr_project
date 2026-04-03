-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: enhance_department_position
-- Adds: code, working_type, description, is_active, timestamps to department
-- Adds: code, department_id FK, description, is_active, timestamps to position
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Department enhancements ───────────────────────────────────────────────────

ALTER TABLE "department"
  ADD COLUMN IF NOT EXISTS "code"         VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "working_type" VARCHAR(10)  NOT NULL DEFAULT 'FIXED',
  ADD COLUMN IF NOT EXISTS "description"  TEXT,
  ADD COLUMN IF NOT EXISTS "is_active"    BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Back-fill code for existing rows: DEPT-<id>
UPDATE "department" SET "code" = 'DEPT-' || "id" WHERE "code" IS NULL;

-- Now enforce NOT NULL + UNIQUE
ALTER TABLE "department" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "department" ADD CONSTRAINT "department_code_key" UNIQUE ("code");

-- ── Position enhancements ─────────────────────────────────────────────────────

ALTER TABLE "position"
  ADD COLUMN IF NOT EXISTS "code"          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "department_id" INTEGER REFERENCES "department"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "description"   TEXT,
  ADD COLUMN IF NOT EXISTS "is_active"     BOOLEAN      NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Back-fill code for existing rows: POS-<id>
UPDATE "position" SET "code" = 'POS-' || "id" WHERE "code" IS NULL;

ALTER TABLE "position" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "position" ADD CONSTRAINT "position_code_key" UNIQUE ("code");

-- Index for position→department lookups
CREATE INDEX IF NOT EXISTS "position_department_id_idx" ON "position"("department_id");
