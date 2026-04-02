-- Add details JSONB column to audit_log for storing structured audit context
ALTER TABLE "audit_log" ADD COLUMN "details" JSONB;
