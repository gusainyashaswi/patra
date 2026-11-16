import { ApiError } from "../utils/apiError.js";
import { getResendTransport, readResendDomains } from "./resend.service.js";
import { transportRepo } from "../repositories/transport.repo.js";
import { encrypt } from "../lib/crypto.js";
import type { CreateTransportBody } from "../schemas/transport.schema.js";

export const list = (orgId: string) => transportRepo.list(orgId);

export async function create(orgId: string, input: CreateTransportBody) {
  const doc = await transportRepo.create(orgId, {
    name: input.name,
    type: input.type,
    credentialsEncrypted: encrypt(input.apiKey),
    ratePerSecond: 2,
    dailyLimit: undefined,
    isDefault: false,
    status: "UNVERIFIED",
  });
  const { credentialsEncrypted: _creds, ...safe } = doc.toObject();
  return safe;
}

export async function checkConnection(orgId: string, id: string) {
  const transport = await getResendTransport(orgId, id);
  let message = "Resend credentials verified.";
  try {
    await readResendDomains(transport.credentialsEncrypted);
    transport.status = "VERIFIED";
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 422) throw error;
    transport.status = "FAILED";
    message = error.message;
  }
  transport.lastTestedAt = new Date();
  await transport.save();
  return { id: transport.id, status: transport.status, lastTestedAt: transport.lastTestedAt, message };
}
