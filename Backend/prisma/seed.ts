// Loads clinics, vets and the demo/admin accounts. Safe to re-run: every
// write is an upsert, so existing users, pets and bookings are left alone.
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.ts";
import { CLINICS, DEMO_PET, DEMO_USER, VETS } from "./seedData.ts";

async function main() {
  for (const { id, ...data } of CLINICS) {
    await prisma.clinic.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  for (const { id, days, ...vet } of VETS) {
    const data = { ...vet, workingDays: days };
    await prisma.vet.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminPassword) {
    await prisma.user.upsert({
      where: { email: "admin@gmail.com" },
      create: {
        name: "Admin",
        email: "admin@gmail.com",
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: "admin",
      },
      update: {},
    });
  } else {
    console.warn("SEED_ADMIN_PASSWORD not set — skipping admin account.");
  }

  const demo = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    create: {
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      mobile: DEMO_USER.mobile,
      passwordHash: await bcrypt.hash(DEMO_USER.password, 10),
    },
    update: {},
  });

  const { name, species, breed, gender, age, weight, notes } = DEMO_PET;
  const hasPet = await prisma.pet.findFirst({ where: { ownerId: demo.id, name } });
  if (!hasPet) {
    await prisma.pet.create({
      data: { ownerId: demo.id, name, species, breed, gender, age, weight, notes },
    });
  }

  console.log(`Seeded ${CLINICS.length} clinics, ${VETS.length} vets, demo + admin users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
