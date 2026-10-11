import bcrypt from "bcryptjs";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { endSession, startSession } from "../auth.ts";
import { prisma } from "../db.ts";
import { HttpError, isUniqueViolation, parse } from "../http.ts";
import { petBasics } from "../schemas.ts";
import { toUserDto } from "../serializers.ts";

export const authRouter = Router();

// Slows down password guessing and mass sign-ups.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Please enter a valid email address."));

const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80),
  mobile: z.string().trim().regex(/^\d{10}$/, "Please enter a valid 10-digit mobile number."),
  email,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(128, "Password is too long."),
  pet: petBasics,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password."),
});

authRouter.post("/signup", authLimiter, async (req, res) => {
  const { pet, password, ...details } = parse(signupSchema, req.body);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { ...details, passwordHash, pets: { create: pet } },
    });
    startSession(res, user.id);
    res.status(201).json({ user: toUserDto(user) });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "An account with this email already exists.");
    }
    throw err;
  }
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message either way, so the form doesn't reveal which emails exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect email or password.");
  }
  startSession(res, user.id);
  res.json({ user: toUserDto(user) });
});

authRouter.post("/logout", (_req, res) => {
  endSession(res);
  res.status(204).end();
});

// 200 with user: null when logged out, so the app's startup check isn't an
// error in the console.
authRouter.get("/me", (req, res) => {
  res.json({ user: req.user ? toUserDto(req.user) : null });
});
