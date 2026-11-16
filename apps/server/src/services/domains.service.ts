import { Domain } from "../models/mailTransport.model.js";
import { ApiError } from "../utils/apiError.js";
import { getResendTransport, readResendDomains } from "./resend.service.js";

export async function syncResendDomains(organizationId: string, transportId: string) {
  const transport = await getResendTransport(organizationId, transportId);
  type RemoteDomain = Awaited<ReturnType<typeof readResendDomains>>["data"][number];
  const domains: RemoteDomain[] = [];
  const cursors = new Set<string>();
  let after: string | undefined;
  for (;;) {
    const page = await readResendDomains(transport.credentialsEncrypted, after);
    domains.push(...page.data);
    if (!page.has_more) break;
    const next = page.data.at(-1)?.id;
    if (!next || cursors.has(next) || cursors.size >= 49) {
      throw new ApiError(502, "Resend did not return a complete domain list.");
    }
    cursors.add(next);
    after = next;
  }

  // One domain name per organization. A sync never reassigns another transport's domain.
  const conflicts: string[] = [];
  for (const domain of domains) {
    const filter = { organizationId, name: domain.name };
    try {
      await Domain.updateOne(filter, {
        $setOnInsert: { ...filter, transportId },
      }, { upsert: true });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
    const result = await Domain.updateOne({ ...filter, transportId }, {
      $set: {
        providerDomainId: domain.id,
        verified: domain.status === "verified" && domain.capabilities?.sending !== "disabled",
      },
    });
    if (!result.matchedCount) conflicts.push(domain.name);
  }

  await Domain.updateMany({
    organizationId,
    transportId,
    providerDomainId: { $exists: true },
    name: { $nin: domains.map((domain) => domain.name) },
  }, { $set: { verified: false } });

  return { synced: domains.length - conflicts.length, conflicts };
}
