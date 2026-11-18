import mongoose from "mongoose";
import { MailTransport } from "../models/mailTransport.model.js";
import { audit } from "./audit.service.js";
import { ApiError } from "../utils/apiError.js";
import { getResendTransport, readResendDomains } from "./resend.service.js";
import { transportRepo } from "../repositories/transport.repo.js";
import { encrypt } from "../lib/crypto.js";
import type { CreateTransportBody } from "../schemas/transport.schema.js";

export const list = (orgId: string) => transportRepo.list(orgId);

export async function create(orgId: string, input: CreateTransportBody, userId?: string) {
  const doc = await mongoose.connection.transaction(async session => {
  const [created] = await MailTransport.create([{ organizationId: orgId,
    name: input.name,
    type: input.type,
    credentialsEncrypted: encrypt(input.apiKey),
    ratePerSecond: 2,
    dailyLimit: undefined,
    isDefault: false,
    status: "UNVERIFIED",
  }], { session });
  await audit(orgId, userId, "transport.create", "transport", created.id, session);
  return created;
  });
  const { credentialsEncrypted: _creds, ...safe } = doc.toObject();
  return safe;
}

export async function checkConnection(orgId: string, id: string, userId?: string) {
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
  await mongoose.connection.transaction(async session => {
    await transport.save({ session });
    await audit(orgId, userId, "transport.test", "transport", id, session, { status: transport.status });
  });
  return {
    id: transport.id,
    status: transport.status,
    lastTestedAt: transport.lastTestedAt,
    message,
  };
}
