import { MailTransport } from "../models/mailTransport.model.js";
import { decrypt } from "../lib/crypto.js";
import {
  type IMailTransportAdapter,
  PermanentError,
} from "./transport.interface.js";
import { ResendTransport } from "./resend.transport.js";
import { FakeMailTransport, fakeTransport } from "./fake.transport.js";

export {
  type IMailTransportAdapter,
  type MailMessage,
  type SendResult,
  TransientError,
  PermanentError,
} from "./transport.interface.js";
export { ResendTransport } from "./resend.transport.js";
export { FakeMailTransport, fakeTransport } from "./fake.transport.js";

// Process-level cache for transport instances
const transportCache = new Map<string, IMailTransportAdapter>();

export function registerTransport(transportId: string, adapter: IMailTransportAdapter): void {
  transportCache.set(transportId, adapter);
}

export function clearTransportCache(): void {
  transportCache.clear();
}

export async function getOrBuildTransport(
  transportId: string,
  organizationId: string,
): Promise<IMailTransportAdapter> {
  const cached = transportCache.get(transportId);
  if (cached) return cached;

  if (process.env.USE_FAKE_TRANSPORT === "true" || process.env.NODE_ENV === "test") {
    transportCache.set(transportId, fakeTransport);
    return fakeTransport;
  }

  const transport = await MailTransport.findOne({
    _id: transportId,
    organizationId,
  }).select("+credentialsEncrypted");

  if (!transport) {
    throw new PermanentError(`Transport ${transportId} not found`);
  }

  let adapter: IMailTransportAdapter;

  switch (transport.type) {
    case "RESEND": {
      if (!transport.credentialsEncrypted) {
        throw new PermanentError("Resend transport has no encrypted credentials");
      }
      const apiKey = decrypt(transport.credentialsEncrypted);
      adapter = new ResendTransport(apiKey);
      break;
    }
    case "SMTP":
    default: {
      // For testing or unsupported types, fall back to fakeTransport if configured
      adapter = fakeTransport;
      break;
    }
  }

  transportCache.set(transportId, adapter);
  return adapter;
}
