import { z } from "zod";
import { decrypt } from "../lib/crypto.js";
import { MailTransport } from "../models/mailTransport.model.js";
import { ApiError } from "../utils/apiError.js";

const domainPage = z.object({
  has_more: z.boolean(),
  data: z.array(z.object({
    id: z.string().min(1),
    name: z.string().trim().toLowerCase().min(1),
    status: z.string(),
    capabilities: z.object({ sending: z.string() }).optional(),
  })),
});

export async function getResendTransport(organizationId: string, id: string) {
  const transport = await MailTransport.findOne({ _id: id, organizationId })
    .select("+credentialsEncrypted");
  if (!transport) throw new ApiError(404, "Transport not found");
  if (transport.type !== "RESEND") throw new ApiError(400, "This action currently supports Resend transports.");
  return transport;
}

export async function readResendDomains(encryptedKey: string, after?: string) {
  const url = new URL("https://api.resend.com/domains");
  if (after) url.searchParams.set("after", after);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${decrypt(encryptedKey)}` },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401 || response.status === 403) {
      throw new ApiError(422, "Resend rejected the key. Use a key with permission to list domains.");
    }
    if (!response.ok) throw new ApiError(502, "Resend could not complete the request. Try again.");
    return domainPage.parse(await response.json());
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Could not read sending domains from Resend. Try again.");
  }
}
