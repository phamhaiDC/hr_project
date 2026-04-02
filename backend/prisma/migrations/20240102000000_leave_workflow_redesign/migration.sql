-- Leave module workflow redesign
-- 1. Rename startDate/endDate → fromDate/toDate on leave_requests
-- 2. Add currentStep to leave_requests
-- 3. Rename action → status on leave_approvals, add actionTime, make approverId nullable
-- 4. Add unique constraint on (leaveRequestId, step)

-- ── leave_requests ────────────────────────────────────────────
ALTER TABLE "leave_requests"
  RENAME COLUMN "startDate" TO "fromDate";

ALTER TABLE "leave_requests"
  RENAME COLUMN "endDate" TO "toDate";

ALTER TABLE "leave_requests"
  ADD COLUMN "currentStep" INTEGER NOT NULL DEFAULT 1;

-- ── leave_approvals ───────────────────────────────────────────
ALTER TABLE "leave_approvals"
  RENAME COLUMN "action" TO "status";

ALTER TABLE "leave_approvals"
  ALTER COLUMN "status" SET DEFAULT 'pending';

ALTER TABLE "leave_approvals"
  ADD COLUMN "actionTime" TIMESTAMP(3);

ALTER TABLE "leave_approvals"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make approverId nullable (step 2 has no pre-assigned approver)
ALTER TABLE "leave_approvals"
  ALTER COLUMN "approverId" DROP NOT NULL;

-- Enforce one record per step per request
ALTER TABLE "leave_approvals"
  ADD CONSTRAINT "leave_approvals_leaveRequestId_step_key"
  UNIQUE ("leaveRequestId", "step");
