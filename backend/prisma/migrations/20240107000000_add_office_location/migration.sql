-- CreateTable: office_location
CREATE TABLE "office_location" (
    "id"        SERIAL          NOT NULL,
    "name"      TEXT            NOT NULL,
    "latitude"  DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius"    INTEGER         NOT NULL,
    "created_at" TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "office_location_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add office_id to employee
ALTER TABLE "employee" ADD COLUMN "office_id" INTEGER;

-- AddForeignKey
ALTER TABLE "employee"
    ADD CONSTRAINT "employee_office_id_fkey"
    FOREIGN KEY ("office_id")
    REFERENCES "office_location"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
