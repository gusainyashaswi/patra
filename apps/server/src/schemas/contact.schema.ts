import { z } from "zod";
import { objectId, orgParams, resourceParams } from "../middleware/orgAccess.js";
import { SUPPRESSION_REASONS } from "../lib/enums.js";

export { orgParams, resourceParams };

export const contactRowSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  name: z.string().trim().max(100).optional(),
  customFields: z.record(z.string()).optional().default({}),
});

export type ContactRow = z.infer<typeof contactRowSchema>;

export const importCommitBody = z.object({
  listName: z.string().trim().min(1).max(100).optional(),
  duplicateHandling: z.enum(["skip", "update"]).default("skip"),
  contacts: z.array(contactRowSchema).min(1, "At least one contact is required").max(50000),
});

export type ImportCommitBody = z.infer<typeof importCommitBody>;

export const createContactBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(100).optional(),
  customFields: z.record(z.string()).optional().default({}),
  listIds: z.array(objectId).optional(),
});

export type CreateContactBody = z.infer<typeof createContactBody>;

export const createSuppressionBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  reason: z.enum(SUPPRESSION_REASONS).default("MANUAL"),
});

export type CreateSuppressionBody = z.infer<typeof createSuppressionBody>;

export const listContactsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().optional(),
  listId: objectId.optional(),
});

export type ListContactsQuery = z.infer<typeof listContactsQuery>;
