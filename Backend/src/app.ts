import cookieParser from "cookie-parser";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadUser } from "./auth.ts";
import { config } from "./config.ts";
import { prisma } from "./db.ts";
import { HttpError, errorHandler } from "./http.ts";
import { authRouter } from "./routes/auth.ts";
import { bookingDraftRouter } from "./routes/bookingDraft.ts";
import { bookingsRouter } from "./routes/bookings.ts";
import { clinicsRouter, vetsRouter } from "./routes/clinics.ts";
import { petsRouter } from "./routes/pets.ts";

export const app = express();

// Behind Render's proxy: lets the rate limiter see the real client IP.
if (config.isProduction) app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(express.json());
app.use(cookieParser());
app.use(loadUser);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: "Database unavailable." });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/pets", petsRouter);
app.use("/api/clinics", clinicsRouter);
app.use("/api/vets", vetsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/booking-draft", bookingDraftRouter);

app.use("/api", () => {
  throw new HttpError(404, "Not found.");
});

// In production the built React app is served from here, so the frontend
// and API share one origin (no CORS, first-party session cookie).
const frontendDist = path.resolve(import.meta.dirname, "../../Frontend/dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { index: false }));
  // Client-side routes (/pets/123, /bookings…) all load index.html.
  app.get(/.*/, (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
}

app.use(errorHandler);
