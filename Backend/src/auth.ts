import type { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.ts";
import { prisma } from "./db.ts";
import type { User } from "./generated/prisma/client.ts";
import { HttpError } from "./http.ts";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const COOKIE = "pawcliniq_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// The session is a signed JWT holding only the user id, in an httpOnly
// cookie so page scripts can never read it. The frontend is served from the
// same origin as the API, so SameSite=Lax is enough.
export const startSession = (res: Response, userId: string) => {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: MAX_AGE_MS / 1000,
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
};

export const endSession = (res: Response) =>
  res.clearCookie(COOKIE, { path: "/" });

// Sets req.user when a valid session cookie is present. The user is re-read
// on every request, so deleted accounts and role changes apply immediately.
export const loadUser: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const { sub } = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.user = (await prisma.user.findUnique({ where: { id: sub } })) ?? undefined;
  } catch {
    // Expired or tampered token — treat as logged out.
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new HttpError(401, "Please log in to continue.");
  next();
};

export const requireUser = (req: { user?: User }) => {
  if (!req.user) throw new HttpError(401, "Please log in to continue.");
  return req.user;
};
