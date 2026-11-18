import type { RequestHandler } from "express";
import { env } from "../config/env.js";

// Cookies are attached automatically by browsers. Bearer tokens are explicit,
// so only cookie-backed mutations require an allowed browser origin.
export const browserOrigin: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path.startsWith("/api/public/unsubscribe/") || req.get("Authorization")?.startsWith("Bearer ")) return next();
  const origin = req.get("Origin");
  const allowed = process.env.CORS_ORIGIN || env.CORS_ORIGIN;
  const cookieSession = req.cookies?.accessToken || req.cookies?.refreshToken;
  if ((origin && origin !== allowed) || (!origin && cookieSession)) return res.status(403).json({ message: "This browser origin is not allowed to change your account" });
  next();
};
