import type { RequestHandler } from "express";
import { ApiError } from "../utils/apiError.js";

export const requirePermission =
  (key: string): RequestHandler =>
  (req, _res, next) => {
    const permissions = req.user?.permissions || [];
    if (permissions.includes("*") || permissions.includes(key)) {
      return next();
    }
    return next(new ApiError(403, `Missing required permission: ${key}`, [], "", "FORBIDDEN"));
  };
