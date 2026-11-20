import { TemplateVersion } from "../models/template.model.js";
import { SenderIdentity, Domain, MailTransport } from "../models/mailTransport.model.js";
import { List, Contact, Suppression } from "../models/audience.model.js";
import { ApiError } from "../utils/apiError.js";
import { contactMergeData, missingMergeFields } from "./contact-merge.js";

export async function validateCampaignLinks(organizationId: string, input: { templateVersionId: string; senderIdentityId: string; listId: string }) {
  const [version, sender, list] = await Promise.all([
    TemplateVersion.findOne({ _id: input.templateVersionId, organizationId }),
    SenderIdentity.findOne({ _id: input.senderIdentityId, organizationId }),
    List.findOne({ _id: input.listId, organizationId }),
  ]);
  if (!version || !sender || !list) throw new ApiError(404, "Template version, sender, or audience not found");
  const domain = await Domain.findOne({ _id: sender.domainId, organizationId, verified: true });
  if (!domain || domain.name !== sender.fromEmail.split("@").at(-1) ||
      !(await MailTransport.exists({ _id: domain.transportId, organizationId, status: "VERIFIED", type: "RESEND" }))) {
    throw new ApiError(400, "Choose a verified Resend sender");
  }
  return { version, sender, list };
}

export async function estimateCampaign(organizationId: string, input: { templateVersionId: string; senderIdentityId: string; listId: string }) {
  const { version, list } = await validateCampaignLinks(organizationId, input);
  const contacts = await Contact.find({ organizationId, _id: { $in: list.contactIds } });
  const blocked = new Set(await Suppression.distinct("email", { organizationId, email: { $in: contacts.map(c => c.email) } }));
  let suppressed = 0;
  let missing = 0;
  for (const contact of contacts) {
    if (blocked.has(contact.email)) { suppressed++; continue; }
    if (missingMergeFields(version.variables, contactMergeData(contact)).length) missing++;
  }
  return { total: contacts.length, suppressed, missing, eligible: contacts.length - suppressed - missing };
}
