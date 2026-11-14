import type { Request, Response, NextFunction, RequestHandler } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";

export const ensureDbConnected: RequestHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (mongoose.connection.readyState !== 1) {
    return next(
      new ApiError(
        503,
        "Database is not connected. Please set a valid MONGODB_URI in apps/server/.env to enable database operations.",
        [],
        "",
        "SERVICE_UNAVAILABLE",
      ),
    );
  }
  next();
};
