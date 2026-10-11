import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.ts";

// The one Prisma client for the whole app. Import `prisma` from here;
// never construct another client.
// Queries go through Neon's pooler when it's configured; migrations use the
// direct DATABASE_URL (see prisma.config.ts).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
