import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireUser } from "../auth.ts";
import { prisma } from "../db.ts";
import type { User } from "../generated/prisma/client.ts";
import { HttpError, isUniqueViolation, isUuid, parse } from "../http.ts";
import { petBasics, serviceType } from "../schemas.ts";
import { bookingInclude, toBookingDto } from "../serializers.ts";
import {
  BOOKING_WINDOW_DAYS,
  TIME_SLOTS,
  istDatePlus,
  toInstant,
  weekdayOf,
} from "../time.ts";

export const bookingsRouter = Router();
bookingsRouter.use(requireAuth);

const isAdmin = (user: User) => user.role === "admin";

// Admins can act on any booking; everyone else only on their own.
const findBooking = async (user: User, id: string) => {
  const booking = isUuid(id)
    ? await prisma.booking.findFirst({
        where: { id, ...(isAdmin(user) ? {} : { userId: user.id }) },
      })
    : null;
  if (!booking) throw new HttpError(404, "This booking no longer exists.");
  return booking;
};

const listQuery = z.object({ petId: z.uuid().optional() });

// Admins see every booking; everyone else only their own. ?petId= narrows
// to one pet's history.
bookingsRouter.get("/", async (req, res) => {
  const user = requireUser(req);
  const { petId } = parse(listQuery, req.query);
  const bookings = await prisma.booking.findMany({
    where: {
      ...(isAdmin(user) ? {} : { userId: user.id }),
      ...(petId && { petId }),
    },
    include: bookingInclude,
    orderBy: { startsAt: "asc" },
  });
  res.json({ bookings: bookings.map((b) => toBookingDto(b, isAdmin(user))) });
});

const createSchema = z.object({
  // The pet being booked for; matched to a saved pet by name, or saved as a
  // new pet profile.
  pet: petBasics,
  serviceType,
  vetId: z.string().min(1, "Please choose a veterinarian."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date."),
  time: z.enum(TIME_SLOTS, "Please choose a time slot."),
  notes: z.string().trim().max(1000, "Notes are too long.").optional().default(""),
});

bookingsRouter.post("/", async (req, res) => {
  const user = requireUser(req);
  const input = parse(createSchema, req.body);

  const vet = await prisma.vet.findUnique({
    where: { id: input.vetId },
    include: { clinic: true },
  });
  if (!vet) throw new HttpError(400, "That veterinarian is no longer available.");
  if (!vet.clinic.services.includes(input.serviceType)) {
    throw new HttpError(400, `${vet.clinic.name} doesn't offer this appointment type.`);
  }
  if (!vet.workingDays.includes(weekdayOf(input.date))) {
    throw new HttpError(400, `${vet.name} isn't available on that day.`);
  }
  const startsAt = toInstant(input.date, input.time);
  if (startsAt <= new Date()) {
    throw new HttpError(400, "That time has already passed. Please pick another.");
  }
  if (input.date >= istDatePlus(BOOKING_WINDOW_DAYS)) {
    throw new HttpError(400, `Bookings open ${BOOKING_WINDOW_DAYS} days in advance.`);
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
          notes: input.notes,
        },
        include: bookingInclude,
      });
      // The in-progress booking is done.
      await tx.bookingDraft.deleteMany({ where: { userId: user.id } });
      return created;
    });
    res.status(201).json({ booking: toBookingDto(booking, isAdmin(user)) });
  } catch (err) {
    // The bookings_one_per_slot index: someone else got there first.
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "That time slot was just taken. Please pick another.");
    }
    throw err;
  }
});

bookingsRouter.patch("/:id/cancel", async (req, res) => {
  const user = requireUser(req);
  const booking = await findBooking(user, req.params.id);
  if (booking.status === "cancelled") {
    throw new HttpError(409, "This booking is already cancelled.");
  }
  if (booking.startsAt <= new Date()) {
    throw new HttpError(409, "Past appointments can't be cancelled.");
  }
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "cancelled" },
    include: bookingInclude,
  });
  res.json({ booking: toBookingDto(updated, isAdmin(user)) });
});

// Removing from history is only for cancelled or past bookings; an upcoming
// appointment has to be cancelled first so the clinic isn't left guessing.
bookingsRouter.delete("/:id", async (req, res) => {
  const booking = await findBooking(requireUser(req), req.params.id);
  if (booking.status === "confirmed" && booking.startsAt > new Date()) {
    throw new HttpError(409, "Cancel this appointment before removing it.");
  }
  await prisma.booking.delete({ where: { id: booking.id } });
  res.status(204).end();
});
