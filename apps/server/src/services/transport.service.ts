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
