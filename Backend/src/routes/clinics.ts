import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.ts";
import { prisma } from "../db.ts";
import { HttpError, parse } from "../http.ts";
import { SERVICE_TYPES, VISIT_TYPES } from "../schemas.ts";
import { toClinicDto, toVetDto } from "../serializers.ts";
import { fromInstant, istDayRange } from "../time.ts";

// Clinics and vets are public, so visitors can browse before signing up.
export const clinicsRouter = Router();
export const vetsRouter = Router();

const serviceQuery = z.object({
  service: z.enum(SERVICE_TYPES).optional(),
  visit: z.enum(VISIT_TYPES).optional(),
});

clinicsRouter.get("/", async (req, res) => {
  const { service, visit } = parse(serviceQuery, req.query);
  const clinics = await prisma.clinic.findMany({
    where: {
      ...(service && { services: { has: service } }),
      ...(visit === "home" && { homeVisits: true }),
    },
    orderBy: { rating: "desc" },
  });
  res.json({ clinics: clinics.map(toClinicDto) });
});

clinicsRouter.get("/:id/vets", async (req, res) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: req.params.id },
    include: { vets: { orderBy: { rating: "desc" } } },
  });
  if (!clinic) throw new HttpError(404, "Clinic not found.");
  res.json({ vets: clinic.vets.map((vet) => toVetDto({ ...vet, clinic })) });
});

const dateQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date."),
});

// Times already taken on a day. Only the times are returned — never who
// booked them.
vetsRouter.get("/:id/booked-slots", requireAuth, async (req, res) => {
  const { date } = parse(dateQuery, req.query);
  const bookings = await prisma.booking.findMany({
    where: {
      vetId: String(req.params.id),
      status: "confirmed",
      startsAt: istDayRange(date),
    },
    select: { startsAt: true },
  });
  res.json({ slots: bookings.map((b) => fromInstant(b.startsAt).time) });
});
