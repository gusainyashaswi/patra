import { z } from "zod";
import { objectId, orgParams, resourceParams } from "../middleware/orgAccess.js";

export const templateParams = resourceParams;
export { orgParams };

export const pageSettingsSchema = z.object({
  bg: z.string().default("#ffffff"),
  width: z.number().int().min(320).max(800).default(600),
  text: z.string().default("#1c1917"),
  align: z.enum(["left", "center", "right"]).default("left"),
});

export const blockSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(["text", "image", "button", "divider", "spacer"]),
  })
  .passthrough();

export const draftSchema = z.object({
  subject: z.string().max(200).optional(),
  previewText: z.string().max(200).optional(),
  page: pageSettingsSchema.optional(),
  blocks: z.array(blockSchema).optional(),
});

export const createTemplateBody = z.object({
  name: z.string().trim().min(1, "Template name is required").max(100),
  subject: z.string().trim().max(200).optional(),
  previewText: z.string().trim().max(200).optional(),
  page: pageSettingsSchema.optional(),
  blocks: z.array(blockSchema).optional(),
  draft: draftSchema.optional(),
});

export type CreateTemplateBody = z.infer<typeof createTemplateBody>;

export const saveDraftBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  subject: z.string().trim().max(200).optional(),
  previewText: z.string().trim().max(200).optional(),
  page: pageSettingsSchema.partial().optional(),
  blocks: z.array(blockSchema).optional(),
  draft: draftSchema.optional(),
});

export type SaveDraftBody = z.infer<typeof saveDraftBody>;

export const publishTemplateBody = z
  .object({
    subject: z.string().trim().max(200).optional(),
    previewText: z.string().trim().max(200).optional(),
  })
  .optional();

export type PublishTemplateBody = z.infer<typeof publishTemplateBody>;

export const previewTemplateBody = z.object({
  sampleData: z.record(z.unknown()).optional().default({}),
});

export type PreviewTemplateBody = z.infer<typeof previewTemplateBody>;

export const testSendBody = z.object({
  to: z.string().trim().email().optional(),
  senderIdentityId: objectId.optional(),
  sampleData: z.record(z.unknown()).optional().default({}),
});

export type TestSendBody = z.infer<typeof testSendBody>;
