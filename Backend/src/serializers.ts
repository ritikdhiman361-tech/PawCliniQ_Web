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
import { fromInstant, vetSlots } from "./time.ts";

const SERVICE_LABELS = {
  checkup: "Routine Checkup",
  vaccination: "Vaccination",
  grooming: "Grooming",
  emergency: "Emergency",
} as const;

const toNumber = (value: { toNumber(): number } | null) =>
  value === null ? null : value.toNumber();

export const toUserDto = (user: User & { clinic: Clinic | null }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  mobile: user.mobile ?? "",
  role: user.role,
  // Clinic-staff accounts only.
  clinic: user.clinic ? { id: user.clinic.id, name: user.clinic.name } : null,
});

const STATUS_LABELS = {
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
} as const;

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// [1, 2, 3, 4, 5, 6] → "Mon–Sat"; [1, 3, 5] → "Mon, Wed, Fri"
const formatDays = (days: number[]) => {
  if (days.length === 7) return "Every day";
  // Week order starting Monday, so Mon–Sat reads as one run.
  const order = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const isRun = order.every((d, i) => i === 0 || d === (order[i - 1] + 1) % 7);
  return isRun && order.length > 2
    ? `${WEEKDAYS[order[0]]}–${WEEKDAYS[order.at(-1)!]}`
    : order.map((d) => WEEKDAYS[d]).join(", ");
};

// "09:00" → "9am", "19:30" → "7:30pm", "24:00" → "12am"
const formatClock = (clock: string) => {
  const [h, m] = clock.split(":").map(Number);
  const hour12 = h % 12 || 12;
  return `${hour12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h % 24 < 12 ? "am" : "pm"}`;
};

const isAllDay = (start: string, end: string) => start === end || (start === "00:00" && end === "24:00");

const formatHours = (start: string, end: string) =>
  isAllDay(start, end) ? "24 hours" : `${formatClock(start)}–${formatClock(end)}`;

export const toClinicDto = (clinic: Clinic) => ({
  ...clinic,
  rating: clinic.rating.toNumber(),
  open24Hours: isAllDay(clinic.openTime, clinic.closeTime),
  hours: `${formatDays(clinic.openDays)}, ${formatHours(clinic.openTime, clinic.closeTime)}`,
});

type VetWithClinic = Vet & { clinic: Clinic };

// A vet only works on days their clinic is open, and offers the slots from
// their shift (or the clinic's hours).
export const toVetDto = ({ workingDays, clinic, ...vet }: VetWithClinic) => ({
  ...vet,
  rating: vet.rating.toNumber(),
  days: workingDays.filter((d) => clinic.openDays.includes(d)),
  hours: formatHours(vet.startTime ?? clinic.openTime, vet.endTime ?? clinic.closeTime),
  slots: vetSlots(vet, clinic),
});

type BookingWithRelations = Booking & {
  clinic: Clinic;
  vet: Vet;
  user: User;
};

// Owner contact details are only included for staff (admins and the clinic).
export const toBookingDto = (b: BookingWithRelations, withContact: boolean) => ({
  id: b.id,
  status: STATUS_LABELS[b.status],
  cancelReason: b.cancelReason ?? "",
  startsAt: b.startsAt,
  ...fromInstant(b.startsAt),
  serviceType: b.serviceType,
  appointmentType: SERVICE_LABELS[b.serviceType],
  visitType: b.visitType,
  homeAddress: b.homeAddress ?? "",
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
  ...(withContact && {
    name: b.user.name,
    userEmail: b.user.email,
    phone: b.user.mobile ?? "",
  }),
});

export const bookingInclude = { clinic: true, vet: true, user: true } as const;

type DraftWithRelations = BookingDraft & { clinic: Clinic | null; vet: VetWithClinic | null };

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
        visitType: d.visitType ?? "clinic",
        notes: d.notes,
      }
    : null,
  clinic: d?.clinic ? toClinicDto(d.clinic) : null,
  vet: d?.vet ? toVetDto(d.vet) : null,
});

export const draftInclude = { clinic: true, vet: { include: { clinic: true } } } as const;
