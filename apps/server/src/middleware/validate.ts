import type { RequestHandler } from "express";
import type { ZodTypeAny } from "zod";
import { ZodError } from "zod";

// Validates req.params, req.body, and/or req.query against Zod schemas.
// Passes ZodError to next() so the global error handler can respond with 400.
export const validate =
  (schema: { body?: ZodTypeAny; params?: ZodTypeAny; query?: ZodTypeAny }): RequestHandler =>
  (req, _res, next) => {
    try {
      if (schema.params) req.params = schema.params.parse(req.params);
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query) as never;
      next();
    } catch (err) {
      next(err instanceof ZodError ? err : new Error(String(err)));
    }
  };
