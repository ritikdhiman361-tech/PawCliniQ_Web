-- CreateTable
CREATE TABLE "booking_drafts" (
    "user_id" UUID NOT NULL,
    "pet_name" TEXT,
    "pet_type" TEXT,
    "pet_breed" TEXT,
    "service_type" "ServiceType",
    "notes" TEXT NOT NULL DEFAULT '',
    "clinic_id" TEXT,
    "vet_id" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("user_id")
);

-- AddForeignKey
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_drafts" ADD CONSTRAINT "booking_drafts_vet_id_fkey" FOREIGN KEY ("vet_id") REFERENCES "vets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

