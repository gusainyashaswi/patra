import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";
import { ApiError } from "../utils/apiError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      error: { code: err.code, message: err.message },
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      statusCode: err.status,
      message: err.message,
      error: { code: err.code, message: err.message },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: "Validation Error",
      error: { code: "VALIDATION", message: "Invalid request payload", issues: err.issues },
      errors: err.issues,
    });
  }

  console.error("Unhandled Error:", err);
  const status =
    typeof err?.statusCode === "number"
      ? err.statusCode
      : typeof err?.status === "number"
        ? err.status
        : 500;
  const message = err?.message || "Internal server error";

  res.status(status).json({
    success: false,
    statusCode: status,
    message,
    error: { code: "INTERNAL", message },
  });
};
