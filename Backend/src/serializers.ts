// Shapes the API sends to the frontend. Field names match what the React
// components already render, so the UI didn't need restructuring.
import type {
  Booking,
  BookingDraft,
  Clinic,
  Pet,
  User,
  Vet,
} from "./generated/prisma/client.ts";
import { fromInstant } from "./time.ts";

const SERVICE_LABELS = {
  checkup: "Routine Checkup",
  vaccination: "Vaccination",
  grooming: "Grooming",
  emergency: "Emergency",
} as const;

const toNumber = (value: { toNumber(): number } | null) =>
  value === null ? null : value.toNumber();

export const toUserDto = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  mobile: user.mobile ?? "",
  role: user.role,
});

export const toPetDto = (pet: Pet) => ({
  id: pet.id,
  name: pet.name,
  species: pet.species,
  breed: pet.breed,
  gender: pet.gender ?? "",
  age: toNumber(pet.age),
  weight: toNumber(pet.weight),
  notes: pet.notes,
  createdAt: pet.createdAt,
});

export const toClinicDto = (clinic: Clinic) => ({
  ...clinic,
  rating: clinic.rating.toNumber(),
});

export const toVetDto = ({ workingDays, ...vet }: Vet) => ({
  ...vet,
  rating: vet.rating.toNumber(),
  days: workingDays,
});

type BookingWithRelations = Booking & {
  clinic: Clinic;
  vet: Vet;
  user: User;
};

// Owner contact details are only included for admins.
export const toBookingDto = (b: BookingWithRelations, forAdmin: boolean) => ({
  id: b.id,
  status: b.status === "cancelled" ? "Cancelled" : "Confirmed",
  startsAt: b.startsAt,
  ...fromInstant(b.startsAt),
  serviceType: b.serviceType,
  appointmentType: SERVICE_LABELS[b.serviceType],
  petId: b.petId,
  petName: b.petName,
  petType: b.petType,
  breed: b.petBreed,
  clinicId: b.clinicId,
  clinic: b.clinic.name,
  vetId: b.vetId,
  vet: b.vet.name,
  notes: b.notes,
  createdAt: b.createdAt,
  ...(forAdmin && {
    name: b.user.name,
    userEmail: b.user.email,
    phone: b.user.mobile ?? "",
  }),
});

export const bookingInclude = { clinic: true, vet: true, user: true } as const;

type DraftWithRelations = BookingDraft & { clinic: Clinic | null; vet: Vet | null };

// Grouped the way the booking-flow pages read it; a missing draft is an
// empty one.
export const toDraftDto = (d: DraftWithRelations | null) => ({
  pet: d?.petName
    ? { name: d.petName, typeLabel: d.petType, breedLabel: d.petBreed }
    : null,
  appointment: d?.serviceType
    ? {
        type: d.serviceType,
        typeLabel: SERVICE_LABELS[d.serviceType],
        notes: d.notes,
      }
    : null,
  clinic: d?.clinic ? toClinicDto(d.clinic) : null,
  vet: d?.vet ? toVetDto(d.vet) : null,
});

export const draftInclude = { clinic: true, vet: true } as const;
