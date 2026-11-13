import { z } from "zod";

export const orgParams = z.object({ orgId: z.string().length(24) });
export const transportIdParams = orgParams.extend({
  id: z.string().length(24),
});

export const createTransportBody = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(["RESEND", "SMTP", "SES"]),
  apiKey: z.string().min(1),
});
export type CreateTransportBody = z.infer<typeof createTransportBody>;
