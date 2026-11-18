import { Router } from "express";
import { Organization } from "../models/identity.model.js";
import { Suppression } from "../models/audience.model.js";
import { ensureDbConnected } from "../middleware/ensureDb.js";
import { verifyUnsubscribeToken } from "../services/render.service.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const unsubscribeRouter = Router();
unsubscribeRouter.use(ensureDbConnected);

function identity(token: unknown) {
  if (typeof token !== "string" || token.length > 2048) throw new ApiError(400, "Invalid unsubscribe link");
  const result = verifyUnsubscribeToken(token);
  if (!result.valid || !result.organizationId || !result.email) throw new ApiError(400, "This unsubscribe link is invalid or expired.");
  return { organizationId: result.organizationId, email: result.email };
}

const page = (content: string) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email preferences · Patra</title></head><body style="margin:0;background:#f1eee5;color:#292524;font:16px/1.6 system-ui,sans-serif"><main style="max-width:480px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #d6d3d1;border-radius:12px">${content}</main></body></html>`;

unsubscribeRouter.use((_req, res, next) => {
  res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" });
  next();
});

unsubscribeRouter.get("/:token", asyncHandler(async (req, res) => {
  const filter = identity(req.params.token);
  if (!(await Organization.exists({ _id: filter.organizationId }))) throw new ApiError(404, "Organization not found");
  const suppressed = await Suppression.exists(filter);
  res.type("html").send(page(suppressed
    ? "<h1>You’re unsubscribed</h1><p>This organization will exclude your address from future campaigns.</p>"
    : '<h1>Unsubscribe from emails?</h1><p>You can stop receiving future campaigns from this organization.</p><form method="post"><button type="submit" style="padding:12px 20px;background:#9a3412;color:white;border:0;border-radius:6px;font:inherit;cursor:pointer">Confirm unsubscribe</button></form>'));
}));

unsubscribeRouter.post("/:token", asyncHandler(async (req, res) => {
  const filter = identity(req.params.token);
  if (!(await Organization.exists({ _id: filter.organizationId }))) throw new ApiError(404, "Organization not found");
  try {
    await Suppression.updateOne(filter, { $setOnInsert: { ...filter, reason: "UNSUBSCRIBED" } }, { upsert: true });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  res.type("html").send(page("<h1>You’re unsubscribed</h1><p>This organization will exclude your address from future campaigns. You can close this page.</p>"));
}));
