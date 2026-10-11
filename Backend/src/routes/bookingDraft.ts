import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireUser } from "../auth.ts";
import { prisma } from "../db.ts";
import { HttpError, parse } from "../http.ts";
import { petBasics, serviceType } from "../schemas.ts";
import { draftInclude, toDraftDto } from "../serializers.ts";

// The booking the logged-in user is part-way through. Each step of the flow
// (pet details → clinic → vet) saves here; POST /api/bookings deletes it.
export const bookingDraftRouter = Router();
bookingDraftRouter.use(requireAuth);

// A draft left untouched this long is treated as abandoned, so an old
// half-finished booking doesn't pre-fill the form weeks later.
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const EMPTY = {
  petName: null,
  petType: null,
  petBreed: null,
  serviceType: null,
  notes: "",
  clinicId: null,
  vetId: null,
};
type DraftFields = {
  petName: string | null;
  petType: string | null;
  petBreed: string | null;
  serviceType: z.infer<typeof serviceType> | null;
  notes: string;
  clinicId: string | null;
  vetId: string | null;
};

// Every field is optional: only what's sent changes. null clears a field.
const changesSchema = z.object({
  pet: petBasics.nullable().optional(),
  serviceType: serviceType.nullable().optional(),
  notes: z.string().trim().max(1000, "Notes are too long.").optional(),
  clinicId: z.string().min(1).nullable().optional(),
  vetId: z.string().min(1).nullable().optional(),
});

const findDraft = async (userId: string) => {
  const draft = await prisma.bookingDraft.findUnique({
    where: { userId },
    include: draftInclude,
  });
  if (!draft || Date.now() - draft.updatedAt.getTime() > DRAFT_TTL_MS) return null;
  return draft;
};

const applyChanges = (base: DraftFields, changes: z.infer<typeof changesSchema>) => {
  const next = { ...base };
  if (changes.pet !== undefined) {
    next.petName = changes.pet?.name ?? null;
    next.petType = changes.pet?.species ?? null;
    next.petBreed = changes.pet?.breed ?? null;
  }
  if (changes.serviceType !== undefined) next.serviceType = changes.serviceType;
  if (changes.notes !== undefined) next.notes = changes.notes;
  if (changes.clinicId !== undefined && changes.clinicId !== base.clinicId) {
    next.clinicId = changes.clinicId;
    // A vet from the previous clinic no longer applies.
    next.vetId = null;
  }
  if (changes.vetId !== undefined) next.vetId = changes.vetId;
  return next;
};

// Rejects ids that don't exist or don't fit together, so the later steps can
// trust what they read back.
const validate = async (fields: DraftFields) => {
  if (fields.clinicId) {
    const clinic = await prisma.clinic.findUnique({ where: { id: fields.clinicId } });
    if (!clinic) throw new HttpError(400, "That clinic is no longer available.");
  }
  if (fields.vetId) {
    const vet = await prisma.vet.findUnique({ where: { id: fields.vetId } });
    if (!vet) throw new HttpError(400, "That veterinarian is no longer available.");
    if (vet.clinicId !== fields.clinicId) {
      throw new HttpError(400, `${vet.name} doesn't work at the selected clinic.`);
    }
  }
};

const save = async (userId: string, fields: DraftFields) => {
  await validate(fields);
  return prisma.bookingDraft.upsert({
    where: { userId },
    create: { userId, ...fields },
    update: fields,
    include: draftInclude,
  });
};

bookingDraftRouter.get("/", async (req, res) => {
  res.json({ draft: toDraftDto(await findDraft(requireUser(req).id)) });
});

// Merge into the current draft.
bookingDraftRouter.patch("/", async (req, res) => {
  const user = requireUser(req);
  const changes = parse(changesSchema, req.body);
  const current = await findDraft(user.id);
  const base: DraftFields = current
    ? {
        petName: current.petName,
        petType: current.petType,
        petBreed: current.petBreed,
        serviceType: current.serviceType,
        notes: current.notes,
        clinicId: current.clinicId,
        vetId: current.vetId,
      }
    : EMPTY;
  const draft = await save(user.id, applyChanges(base, changes));
  res.json({ draft: toDraftDto(draft) });
});

// Start over with only what's sent (e.g. "Book" from a pet profile).
bookingDraftRouter.put("/", async (req, res) => {
  const user = requireUser(req);
  const changes = parse(changesSchema, req.body);
  const draft = await save(user.id, applyChanges(EMPTY, changes));
  res.json({ draft: toDraftDto(draft) });
});

bookingDraftRouter.delete("/", async (req, res) => {
  await prisma.bookingDraft.deleteMany({ where: { userId: requireUser(req).id } });
  res.status(204).end();
});
