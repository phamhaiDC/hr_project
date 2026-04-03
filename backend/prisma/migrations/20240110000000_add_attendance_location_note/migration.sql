-- Add location note and hasLocation flag to attendance
-- locationNote stores the employee's reason when GPS is unavailable
-- hasLocation reflects whether GPS coordinates were captured at check-in

ALTER TABLE "attendance" ADD COLUMN "location_note" TEXT;
ALTER TABLE "attendance" ADD COLUMN "has_location" BOOLEAN NOT NULL DEFAULT false;
