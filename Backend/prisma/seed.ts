// Loads the sample clinics, vets and the demo/admin accounts. Safe to re-run:
// it only creates what's missing and never overwrites existing rows, so
// changes made in the admin panel are kept.
import bcrypt from "bcryptjs";
import { prisma } from "../src/db.ts";
import { CLOCK_TIME } from "../src/time.ts";
import { CLINICS, DEMO_PET, DEMO_USER, VETS } from "./seedData.ts";

// Catches typos in opening hours before they reach the booking page.
function checkHours() {
  const isDay = (d: number) => Number.isInteger(d) && d >= 0 && d <= 6;
  for (const c of CLINICS) {
    if (!c.openDays.length || !c.openDays.every(isDay)) throw new Error(`${c.id}: bad openDays`);
    if (!CLOCK_TIME.test(c.openTime) || !CLOCK_TIME.test(c.closeTime)) {
      throw new Error(`${c.id}: times must be "HH:MM" (24-hour)`);
    }
    if (c.slotMinutes !== undefined && !(c.slotMinutes >= 5 && c.slotMinutes <= 240)) {
      throw new Error(`${c.id}: slotMinutes must be 5–240`);
    }
  }
  for (const v of VETS) {
    const clinic = CLINICS.find((c) => c.id === v.clinicId);
    if (!clinic) throw new Error(`${v.id}: unknown clinic ${v.clinicId}`);
    if (!v.days.every((d) => clinic.openDays.includes(d))) {
      throw new Error(`${v.id}: works on a day ${clinic.id} is closed`);
    }
    if ((v.startTime === undefined) !== (v.endTime === undefined)) {
      throw new Error(`${v.id}: set both startTime and endTime, or neither`);
    }
    if (v.startTime && (!CLOCK_TIME.test(v.startTime) || !CLOCK_TIME.test(v.endTime!))) {
      throw new Error(`${v.id}: times must be "HH:MM" (24-hour)`);
    }
  }
}

async function main() {
  checkHours();

  for (const { id, homeVisits = false, ...rest } of CLINICS) {
    const data = { ...rest, homeVisits };
    // Create-only: clinics are edited in the admin panel after that.
    await prisma.clinic.upsert({ where: { id }, create: { id, ...data }, update: {} });
  }

  for (const { id, days, startTime = null, endTime = null, ...vet } of VETS) {
    const data = { ...vet, workingDays: days, startTime, endTime };
    await prisma.vet.upsert({ where: { id }, create: { id, ...data }, update: {} });
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
