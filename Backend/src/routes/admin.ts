import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { requireAdmin } from "../auth.ts";
import { prisma } from "../db.ts";
import { HttpError, isUniqueViolation, isUuid, parse } from "../http.ts";
import { SERVICE_TYPES } from "../schemas.ts";
import { CLOCK_TIME } from "../time.ts";

// Managing clinics, their vets and clinic-staff logins. Admins only.
export const adminRouter = Router();
adminRouter.use(requireAdmin);

const clock = z.string().regex(CLOCK_TIME, 'Use a 24-hour time like "09:00".');
const weekdays = z
  .array(z.number().int().min(0).max(6))
  .min(1, "Choose at least one day.")
  .transform((days) => [...new Set(days)].sort());
const text = (label: string, max: number) =>
  z.string().trim().min(1, `Please enter the ${label}.`).max(max);

const clinicSchema = z.object({
  name: text("clinic name", 100),
  location: text("area and city", 100),
  address: text("address", 200),
  phone: text("phone number", 30),
  email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email.")),
  description: z.string().trim().max(500).default(""),
  services: z.array(z.enum(SERVICE_TYPES)).min(1, "Choose at least one service."),
  openDays: weekdays,
  openTime: clock,
  closeTime: clock,
  slotMinutes: z.number().int().min(10).max(120),
  homeVisits: z.boolean(),
  active: z.boolean(),
});

const vetSchema = z
  .object({
    name: text("vet's name", 80),
    specialty: text("specialty", 100),
    experience: z.number().int().min(0).max(60),
    workingDays: weekdays,
    // Both empty = the clinic's hours.
    startTime: clock.nullable(),
    endTime: clock.nullable(),
    active: z.boolean(),
  })
  .refine((v) => (v.startTime === null) === (v.endTime === null), {
    message: "Set both shift times, or leave both empty to use the clinic's hours.",
  });

const staffSchema = z.object({
  name: text("name", 80),
  email: z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email.")),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

// "Happy Tails Pet Hospital" → "clinic-happy-tails-pet-hospital", made unique.
const newId = async (prefix: string, name: string, exists: (id: string) => Promise<unknown>) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const base = `${prefix}-${slug || "new"}`;
  for (let n = 1; ; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    if (!(await exists(id))) return id;
  }
};

const toAdminClinic = (
  clinic: Awaited<ReturnType<typeof findClinics>>[number],
) => ({
  ...clinic,
  rating: clinic.rating.toNumber(),
  vets: clinic.vets.map((v) => ({ ...v, rating: v.rating.toNumber() })),
});

const findClinics = () =>
  prisma.clinic.findMany({
    orderBy: { name: "asc" },
    include: {
      vets: { orderBy: { name: "asc" } },
      staff: { select: { id: true, name: true, email: true }, orderBy: { name: "asc" } },
    },
  });

const findClinic = async (id: string) => {
  const clinic = await prisma.clinic.findUnique({ where: { id } });
  if (!clinic) throw new HttpError(404, "Clinic not found.");
  return clinic;
};

adminRouter.get("/clinics", async (_req, res) => {
  res.json({ clinics: (await findClinics()).map(toAdminClinic) });
});

adminRouter.post("/clinics", async (req, res) => {
  const data = parse(clinicSchema, req.body);
  const id = await newId("clinic", data.name, (id) => prisma.clinic.findUnique({ where: { id } }));
  await prisma.clinic.create({ data: { id, ...data, rating: 0 } });
  res.status(201).json({ id });
});

adminRouter.put("/clinics/:id", async (req, res) => {
  const data = parse(clinicSchema, req.body);
  await findClinic(req.params.id);
  await prisma.clinic.update({ where: { id: req.params.id }, data });
  res.json({ id: req.params.id });
});

adminRouter.post("/clinics/:id/vets", async (req, res) => {
  const data = parse(vetSchema, req.body);
  const clinic = await findClinic(req.params.id);
  const id = await newId("vet", data.name, (id) => prisma.vet.findUnique({ where: { id } }));
  await prisma.vet.create({ data: { id, clinicId: clinic.id, ...data, rating: 0 } });
  res.status(201).json({ id });
});

adminRouter.put("/vets/:id", async (req, res) => {
  const data = parse(vetSchema, req.body);
  const vet = await prisma.vet.findUnique({ where: { id: req.params.id } });
  if (!vet) throw new HttpError(404, "Vet not found.");
  await prisma.vet.update({ where: { id: vet.id }, data });
  res.json({ id: vet.id });
});

// A login for the clinic's staff; they see only this clinic's appointments.
adminRouter.post("/clinics/:id/staff", async (req, res) => {
  const { name, email, password } = parse(staffSchema, req.body);
  const clinic = await findClinic(req.params.id);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "clinic",
        clinicId: clinic.id,
      },
    });
    res.status(201).json({ id: user.id });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "An account with this email already exists.");
    }
    throw err;
  }
});

adminRouter.delete("/staff/:id", async (req, res) => {
  // Only clinic-staff logins can be removed here, never owners or admins.
  const { count } = isUuid(req.params.id)
    ? await prisma.user.deleteMany({ where: { id: req.params.id, role: "clinic" } })
    : { count: 0 };
  if (!count) throw new HttpError(404, "Login not found.");
  res.status(204).end();
});
