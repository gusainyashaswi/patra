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

  if (process.env.USE_FAKE_TRANSPORT === "true" || process.env.NODE_ENV === "test") {
    const registered = transportCache.get(transportId);
    if (registered) return registered;
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

  if (transport.status !== "VERIFIED") throw new PermanentError("Transport is not verified");
  const cached = transportCache.get(transportId);
  if (cached) return cached;
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
      throw new PermanentError("This transport type is not supported for campaign delivery");
    }
  }

  transportCache.set(transportId, adapter);
  return adapter;
}
