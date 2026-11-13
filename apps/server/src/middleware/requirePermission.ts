import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";

export const requirePermission =
  (key: string): RequestHandler =>
  (req, _res, next) => {
    if (!req.user?.permissions.includes(key))
      return next(new AppError(403, "FORBIDDEN", `Missing permission: ${key}`));
    next();
  };
