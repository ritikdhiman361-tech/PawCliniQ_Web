import type { ErrorRequestHandler } from "express";
import { z, type ZodType } from "zod";
import { Prisma } from "./generated/prisma/client.ts";

// Throw from any route; the error handler turns it into { error } JSON.
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Parses a request body/query against a schema; the first issue becomes a
// 400 with a message the UI can show as-is.
export const parse = <T>(schema: ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, result.error.issues[0].message);
  return result.data;
};

// Ids in UUID columns: anything else would make Postgres throw, so lookups
// treat a malformed id as not found.
export const isUuid = (id: string) => z.uuid().safeParse(id).success;

export const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Malformed JSON body.
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }
  // Body over express.json's size limit (100 KB).
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "That's too much text to send. Please shorten it and try again." });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
};
