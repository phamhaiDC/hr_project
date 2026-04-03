-- Add office GPS validation columns to attendance table
ALTER TABLE "attendance" ADD COLUMN "office_distance_m" DOUBLE PRECISION;
ALTER TABLE "attendance" ADD COLUMN "is_in_office" BOOLEAN NOT NULL DEFAULT false;
