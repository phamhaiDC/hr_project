-- Add GPS geofence columns to branch table.
-- All columns are nullable so existing rows without coordinates are unaffected.
ALTER TABLE "branch" ADD COLUMN "latitude"  DOUBLE PRECISION;
ALTER TABLE "branch" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "branch" ADD COLUMN "radius"    INTEGER NOT NULL DEFAULT 50;
