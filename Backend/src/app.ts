import cookieParser from "cookie-parser";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadUser } from "./auth.ts";
import { config } from "./config.ts";
import { prisma } from "./db.ts";
import { HttpError, errorHandler } from "./http.ts";
import { adminRouter } from "./routes/admin.ts";
import { authRouter } from "./routes/auth.ts";
import { bookingDraftRouter } from "./routes/bookingDraft.ts";
import { bookingsRouter } from "./routes/bookings.ts";
import { clinicsRouter, vetsRouter } from "./routes/clinics.ts";
import { petsRouter } from "./routes/pets.ts";

export const app = express();

// Behind Render's proxy: lets the rate limiter see the real client IP.
if (config.isProduction) app.set("trust proxy", 1);
app.disable("x-powered-by");

// Basic hardening on every response: no MIME sniffing, the site can't be
// framed by other sites (clickjacking), and browsers stick to HTTPS.
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "frame-ancestors 'none'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    ...(config.isProduction && {
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    }),
  });
  // API answers are per-user; never let a browser or proxy cache them.
  if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
  next();
});

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
app.use("/api/admin", adminRouter);
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
  app.use(
    express.static(frontendDist, {
      index: false,
      // Built files in /assets have a content hash in their name, so they
      // can be cached for a year; a new deploy gets new names.
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.set("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  // Client-side routes (/pets/123, /bookings…) all load index.html, which is
  // always revalidated so a deploy shows up straight away.
  app.get(/.*/, (_req, res) =>
    res.set("Cache-Control", "no-cache").sendFile(path.join(frontendDist, "index.html")),
  );
}

app.use(errorHandler);
