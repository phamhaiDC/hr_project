-- ── ResignationRequest: add workflow columns ─────────────────────────────────
ALTER TABLE "resignation_request"
  ADD COLUMN IF NOT EXISTS "current_step"  INTEGER   DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "created_at"   TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updated_at"   TIMESTAMP;

-- ── ResignationApproval: new table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "resignation_approval" (
  "id"            SERIAL        PRIMARY KEY,
  "request_id"    INTEGER       REFERENCES "resignation_request"("id"),
  "step"          INTEGER,
  "approver_id"   INTEGER       REFERENCES "employee"("id"),
  "approver_role" VARCHAR,
  "status"        VARCHAR       DEFAULT 'pending',
  "comments"      TEXT,
  "action_time"   TIMESTAMP,
  UNIQUE ("request_id", "step")
);

-- ── OffboardingChecklist: add created_at ─────────────────────────────────────
ALTER TABLE "offboarding_checklist"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW();

-- ── EmployeeHistory: add changed_by and created_at ───────────────────────────
ALTER TABLE "employee_history"
  ADD COLUMN IF NOT EXISTS "changed_by"  INTEGER,
  ADD COLUMN IF NOT EXISTS "created_at"  TIMESTAMP DEFAULT NOW();
