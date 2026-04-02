-- Add unique constraint on (employee_id, date) to support upsert from the processor job.
-- Existing duplicate rows (if any) must be deduplicated before applying this constraint.
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_employee_id_date_key"
  ON "attendance" ("employee_id", "date");
