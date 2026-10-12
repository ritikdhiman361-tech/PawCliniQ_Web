import { z } from "zod";

// "" / null / undefined → null, anything else → Number (form inputs send strings).
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    schema.nullable(),
  );

export const SERVICE_TYPES = ["checkup", "vaccination", "grooming", "emergency"] as const;

export const serviceType = z.enum(SERVICE_TYPES, "Please select an appointment type.");

export const VISIT_TYPES = ["clinic", "home"] as const;

export const visitType = z.enum(VISIT_TYPES, "Please choose a clinic or home visit.");

// The pet details collected at sign-up and in the booking form.
export const petBasics = z.object({
  name: z.string().trim().min(1, "Please enter your pet's name.").max(50),
  species: z.string().trim().min(1, "Please select your pet's type.").max(30),
  breed: z.string().trim().min(1, "Please select your pet's breed.").max(60),
});

// The full editable pet profile.
export const petProfile = petBasics.extend({
  gender: z.string().trim().max(20).optional().default(""),
  age: optionalNumber(
    z.number("Age must be a number.").min(0).max(30, "Age must be between 0 and 30 years."),
  ),
  weight: optionalNumber(
    z.number("Weight must be a number.").positive().max(150, "Weight must be between 0 and 150 kg."),
  ),
  notes: z.string().trim().max(1000, "Notes are too long.").optional().default(""),
});
