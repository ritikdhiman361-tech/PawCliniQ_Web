import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireOwner, requireUser } from "../auth.ts";
import { prisma } from "../db.ts";
import type { User } from "../generated/prisma/client.ts";
import { HttpError, isUniqueViolation, isUuid, parse } from "../http.ts";
import { petBasics, serviceType, visitType } from "../schemas.ts";
import { bookingInclude, toBookingDto } from "../serializers.ts";
import {
  BOOKING_WINDOW_DAYS,
  fromInstant,
  istDatePlus,
  isRealDate,
  toInstant,
  vetSlots,
  weekdayOf,
} from "../time.ts";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

const isAdmin = (user: User) => user.role === "admin";
// Admins and clinic staff see owners' contact details and manage visits.
const isStaff = (user: User) => user.role === "admin" || user.role === "clinic";

// Which bookings a user may see: admins all, clinic staff their clinic's,
// everyone else their own.
const visibleTo = (user: User) =>
  isAdmin(user)
    ? {}
    : user.role === "clinic"
      ? { clinicId: user.clinicId ?? "-" }
      : { userId: user.id };

const findBooking = async (user: User, id: string) => {
  const booking = isUuid(id)
    ? await prisma.booking.findFirst({ where: { id, ...visibleTo(user) } })
    : null;
  if (!booking) throw new HttpError(404, "This booking no longer exists.");
  return booking;
};

const listQuery = z.object({ petId: z.uuid().optional() });

// ?petId= narrows to one pet's history.
bookingsRouter.get("/", async (req, res) => {
  const user = requireUser(req);
  const { petId } = parse(listQuery, req.query);
  const bookings = await prisma.booking.findMany({
    where: { ...visibleTo(user), ...(petId && { petId }) },
    include: bookingInclude,
    orderBy: { startsAt: "asc" },
  });
  res.json({ bookings: bookings.map((b) => toBookingDto(b, isStaff(user))) });
});

const createSchema = z.object({
  // The pet being booked for; matched to a saved pet by name, or saved as a
  // new pet profile.
  pet: petBasics,
  serviceType,
  vetId: z.string().min(1, "Please choose a veterinarian."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date."),
  time: z.string().regex(/^\d{2}:\d{2} [AP]M$/, "Please choose a time slot."),
  notes: z.string().trim().max(1000, "Notes are too long.").optional().default(""),
  visitType: visitType.optional().default("clinic"),
  // Required for home visits (checked below); ignored for clinic visits.
  homeAddress: z.string().trim().max(300, "Address is too long.").optional().default(""),
});

bookingsRouter.post("/", requireOwner, async (req, res) => {
  const user = requireUser(req);
  const input = parse(createSchema, req.body);

  // The date itself first, so the message says what's actually wrong.
  if (!isRealDate(input.date)) throw new HttpError(400, "Please choose a valid date.");
  if (input.date < istDatePlus(0)) {
    throw new HttpError(400, "That date has already passed. Please pick another.");
  }
  if (input.date >= istDatePlus(BOOKING_WINDOW_DAYS)) {
    throw new HttpError(400, `Bookings open ${BOOKING_WINDOW_DAYS} days in advance.`);
  }

  const vet = await prisma.vet.findUnique({
    where: { id: input.vetId },
    include: { clinic: true },
  });
  if (!vet || !vet.active || !vet.clinic.active) {
    throw new HttpError(400, "That veterinarian is no longer available.");
  }
  if (!vet.clinic.services.includes(input.serviceType)) {
    throw new HttpError(400, `${vet.clinic.name} doesn't offer this appointment type.`);
  }
  const isHomeVisit = input.visitType === "home";
  if (isHomeVisit && !vet.clinic.homeVisits) {
    throw new HttpError(400, `${vet.clinic.name} doesn't offer home visits.`);
  }
  if (isHomeVisit && input.homeAddress.length < 10) {
    throw new HttpError(400, "Please enter the full address for the home visit.");
  }
  const weekday = weekdayOf(input.date);
  if (!vet.workingDays.includes(weekday) || !vet.clinic.openDays.includes(weekday)) {
    throw new HttpError(400, `${vet.name} isn't available on that day.`);
  }
  if (!vetSlots(vet, vet.clinic).includes(input.time)) {
    throw new HttpError(400, `${vet.name} doesn't see patients at that time.`);
  }
  const startsAt = toInstant(input.date, input.time);
  if (startsAt <= new Date()) {
    throw new HttpError(400, "That time has already passed. Please pick another.");
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const pet =
        (await tx.pet.findFirst({
          where: {
            ownerId: user.id,
            name: { equals: input.pet.name, mode: "insensitive" },
          },
        })) ?? (await tx.pet.create({ data: { ...input.pet, ownerId: user.id } }));

      const created = await tx.booking.create({
        data: {
          userId: user.id,
          petId: pet.id,
          petName: pet.name,
          petType: pet.species,
          petBreed: pet.breed,
          clinicId: vet.clinicId,
          vetId: vet.id,
          serviceType: input.serviceType,
          startsAt,
          visitType: input.visitType,
          homeAddress: isHomeVisit ? input.homeAddress : null,
          notes: input.notes,
        },
        include: bookingInclude,
      });
      // The in-progress booking is done.
      await tx.bookingDraft.deleteMany({ where: { userId: user.id } });
      return created;
    });
    res.status(201).json({ booking: toBookingDto(booking, isStaff(user)) });
  } catch (err) {
    // The bookings_one_per_slot index: someone else got there first.
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "That time slot was just taken. Please pick another.");
    }
    throw err;
  }
});

const cancelSchema = z.object({
  reason: z.string().trim().max(300, "Reason is too long.").optional().default(""),
});

bookingsRouter.patch("/:id/cancel", async (req, res) => {
  const user = requireUser(req);
  const { reason } = parse(cancelSchema, req.body ?? {});
  const booking = await findBooking(user, req.params.id);
  if (booking.status !== "confirmed") {
    throw new HttpError(409, "Only confirmed appointments can be cancelled.");
  }
  if (booking.startsAt <= new Date()) {
    throw new HttpError(409, "Past appointments can't be cancelled.");
  }
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "cancelled", cancelReason: isStaff(user) ? reason || null : null },
    include: bookingInclude,
  });
  res.json({ booking: toBookingDto(updated, isStaff(user)) });
});

const outcomeSchema = z.object({
  status: z.enum(["completed", "no_show"], "Choose completed or no-show."),
});

// The clinic records how the visit went, from the day of the appointment.
bookingsRouter.patch("/:id/status", async (req, res) => {
  const user = requireUser(req);
  if (!isStaff(user)) throw new HttpError(403, "Only the clinic can update a visit.");
  const { status } = parse(outcomeSchema, req.body);
  const booking = await findBooking(user, req.params.id);
  if (booking.status === "cancelled") {
    throw new HttpError(409, "This appointment was cancelled.");
  }
  if (fromInstant(booking.startsAt).date > istDatePlus(0)) {
    throw new HttpError(409, "You can update a visit from the day of the appointment.");
  }
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status },
    include: bookingInclude,
  });
  res.json({ booking: toBookingDto(updated, true) });
});

// Removing from history is only for cancelled or past bookings; an upcoming
// appointment has to be cancelled first so the clinic isn't left guessing.
bookingsRouter.delete("/:id", async (req, res) => {
  const user = requireUser(req);
  // A clinic keeps its visit history; only owners and admins remove bookings.
  if (user.role === "clinic") throw new HttpError(403, "Clinics can't delete bookings.");
  const booking = await findBooking(user, req.params.id);
  if (booking.status === "confirmed" && booking.startsAt > new Date()) {
    throw new HttpError(409, "Cancel this appointment before removing it.");
  }
  await prisma.booking.delete({ where: { id: booking.id } });
  res.status(204).end();
});
