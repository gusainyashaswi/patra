import { Router } from "express";
import { z } from "zod";
import { objectId } from "../middleware/orgAccess.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { validate } from "../middleware/validate.js";
import { Domain, MailTransport, SenderIdentity } from "../models/mailTransport.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const senderBody = z
  .object({
    domainId: objectId,
    displayName: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[^\r\n<>]+$/),
    fromEmail: z.string().trim().toLowerCase().email().max(254),
    replyTo: z.string().trim().toLowerCase().email().max(254).optional(),
  })
  .strict();

export const senderRouter = Router({ mergeParams: true });
senderRouter.use(requirePermission("manage_senders"));

senderRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await SenderIdentity.find({ organizationId: req.user!.organizationId }).sort({
      isDefault: -1,
      displayName: 1,
    });
    res.json({ data });
  }),
);

senderRouter.post(
  "/",
  validate({ body: senderBody }),
  asyncHandler(async (req, res) => {
    const organizationId = req.user!.organizationId!;
    const input = senderBody.parse(req.body);
    const domain = await Domain.findOne({ organizationId, _id: input.domainId });
    if (!domain) throw new ApiError(404, "Sender domain not found");
    if (!domain.verified || input.fromEmail.split("@").at(-1) !== domain.name) {
      throw new ApiError(400, "The From address must use the selected verified domain");
    }
    if (!(await MailTransport.exists({ organizationId, _id: domain.transportId }))) {
      throw new ApiError(404, "Domain transport not found");
    }
    const data = await SenderIdentity.create({
      ...input,
      organizationId,
      transportId: domain.transportId,
    });
    res.status(201).json({ data });
  }),
);
