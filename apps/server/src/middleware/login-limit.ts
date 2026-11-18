import type { RequestHandler } from "express";
// Single API process in the local MVP. A shared limiter is needed when scaling APIs.
const attempts = new Map<string, { count: number; expires: number }>();
export const loginLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  const key = req.ip || "unknown";
  const item = attempts.get(key) ?? { count: 0, expires: now + 15 * 60000 };
  if (attempts.size >= 10000 && !attempts.has(key)) return res.status(429).json({ message: "Try again later" });
  if (++item.count > 10) {
    res.set("Retry-After", String(Math.ceil((item.expires - now) / 1000)));
    return res.status(429).json({ message: "Too many login attempts. Try again in 15 minutes." });
  }
  attempts.set(key, item);
  next();
};
