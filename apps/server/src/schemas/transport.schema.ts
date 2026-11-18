import { z } from "zod";

export const orgParams = z.object({ orgId: z.string().length(24) });
export const transportIdParams = orgParams.extend({
  id: z.string().length(24),
});

export const createTransportBody = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(["RESEND", "SMTP", "SES"]),
  apiKey: z.string().min(1),
  ratePerSecond: z.number().int().min(1).max(100).default(2),
  dailyLimit: z.number().int().min(1).max(1000000).default(100),
});
export type CreateTransportBody = z.infer<typeof createTransportBody>;
