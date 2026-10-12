-- Clinic staff accounts, visit outcomes, and switching clinics/vets off.
ALTER TYPE "Role" ADD VALUE 'clinic';
ALTER TYPE "BookingStatus" ADD VALUE 'completed';
ALTER TYPE "BookingStatus" ADD VALUE 'no_show';

ALTER TABLE "users" ADD COLUMN "clinic_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clinics" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "vets" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bookings" ADD COLUMN "cancel_reason" TEXT;
