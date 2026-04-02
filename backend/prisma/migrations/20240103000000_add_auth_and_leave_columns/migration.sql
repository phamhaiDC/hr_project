-- Add auth columns to employee table
ALTER TABLE "employee"
  ADD COLUMN IF NOT EXISTS "password" VARCHAR,
  ADD COLUMN IF NOT EXISTS "role"     VARCHAR NOT NULL DEFAULT 'employee';

-- Add workflow columns to leave_request
ALTER TABLE "leave_request"
  ADD COLUMN IF NOT EXISTS "reason" TEXT,
  ADD COLUMN IF NOT EXISTS "days"   INTEGER;

-- Ensure current_step has a default
ALTER TABLE "leave_request"
  ALTER COLUMN "current_step" SET DEFAULT 1;

-- Add workflow columns to leave_approval
ALTER TABLE "leave_approval"
  ADD COLUMN IF NOT EXISTS "approver_role" VARCHAR,
  ADD COLUMN IF NOT EXISTS "comments"      TEXT;

-- Ensure status defaults
ALTER TABLE "leave_approval"
  ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "leave_request"
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- Unique constraint: one approval record per (request, step)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leave_approval_request_id_step_key'
  ) THEN
    ALTER TABLE "leave_approval"
      ADD CONSTRAINT "leave_approval_request_id_step_key"
      UNIQUE ("request_id", "step");
  END IF;
END $$;

-- Add email unique index on employee if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'employee' AND indexname = 'employee_email_key'
  ) THEN
    CREATE UNIQUE INDEX "employee_email_key" ON "employee"("email")
      WHERE "email" IS NOT NULL;
  END IF;
END $$;
