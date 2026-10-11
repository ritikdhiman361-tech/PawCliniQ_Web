import { Router } from "express";
import { requireAuth, requireUser } from "../auth.ts";
import { prisma } from "../db.ts";
import { HttpError, isUniqueViolation, isUuid, parse } from "../http.ts";
import { petProfile } from "../schemas.ts";
import { toPetDto } from "../serializers.ts";

export const petsRouter = Router();
petsRouter.use(requireAuth);

const nameTaken = (name: string) =>
  new HttpError(409, `You already have a pet named ${name}.`);

// Every lookup is scoped to the logged-in owner, so one user can never read
// or change another user's pets — a foreign id simply isn't found.
const findOwnPet = async (ownerId: string, id: string) => {
  const pet = isUuid(id) ? await prisma.pet.findFirst({ where: { id, ownerId } }) : null;
  if (!pet) throw new HttpError(404, "This pet profile no longer exists.");
  return pet;
};

petsRouter.get("/", async (req, res) => {
  const pets = await prisma.pet.findMany({
    where: { ownerId: requireUser(req).id },
    orderBy: { createdAt: "asc" },
  });
  res.json({ pets: pets.map(toPetDto) });
});

petsRouter.get("/:id", async (req, res) => {
  const pet = await findOwnPet(requireUser(req).id, req.params.id);
  res.json({ pet: toPetDto(pet) });
});

petsRouter.post("/", async (req, res) => {
  const data = parse(petProfile, req.body);
  try {
    const pet = await prisma.pet.create({
      data: { ...data, ownerId: requireUser(req).id },
    });
    res.status(201).json({ pet: toPetDto(pet) });
  } catch (err) {
    if (isUniqueViolation(err)) throw nameTaken(data.name);
    throw err;
  }
});

petsRouter.put("/:id", async (req, res) => {
  const data = parse(petProfile, req.body);
  const { id } = await findOwnPet(requireUser(req).id, req.params.id);
  try {
    const pet = await prisma.pet.update({ where: { id }, data });
    res.json({ pet: toPetDto(pet) });
  } catch (err) {
    if (isUniqueViolation(err)) throw nameTaken(data.name);
    throw err;
  }
});

// Appointment history stays: bookings keep their pet snapshot and the
// pet_id foreign key is set to null.
petsRouter.delete("/:id", async (req, res) => {
  const { id } = await findOwnPet(requireUser(req).id, req.params.id);
  await prisma.pet.delete({ where: { id } });
  res.status(204).end();
});
