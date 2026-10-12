-- Structured opening hours replace the free-text "hours" label. Existing
-- clinics get the hours that label showed (Mon–Sat, 9am–7pm).
ALTER TABLE "clinics"
    ADD COLUMN "open_days" INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
    ADD COLUMN "open_time" TEXT NOT NULL DEFAULT '09:00',
    ADD COLUMN "close_time" TEXT NOT NULL DEFAULT '19:00',
    ADD COLUMN "slot_minutes" INTEGER NOT NULL DEFAULT 30,
    DROP COLUMN "hours";

ALTER TABLE "clinics"
    ALTER COLUMN "open_days" DROP DEFAULT,
    ALTER COLUMN "open_time" DROP DEFAULT,
    ALTER COLUMN "close_time" DROP DEFAULT;

-- Optional per-vet shift.
ALTER TABLE "vets"
    ADD COLUMN "start_time" TEXT,
    ADD COLUMN "end_time" TEXT;
