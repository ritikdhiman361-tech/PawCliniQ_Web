-- Home visits: clinics opt in, and each booking records where it happens.
CREATE TYPE "VisitType" AS ENUM ('clinic', 'home');

ALTER TABLE "clinics" ADD COLUMN "home_visits" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "bookings"
    ADD COLUMN "visit_type" "VisitType" NOT NULL DEFAULT 'clinic',
    ADD COLUMN "home_address" TEXT;

ALTER TABLE "booking_drafts" ADD COLUMN "visit_type" "VisitType";
