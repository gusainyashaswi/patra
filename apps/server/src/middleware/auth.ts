import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next(new AppError(401, "UNAUTHENTICATED", "Missing token"));
  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; permissions: string[] };
    next();
  } catch {
    next(new AppError(401, "UNAUTHENTICATED", "Invalid or expired token"));
  }
};
