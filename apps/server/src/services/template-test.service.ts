import { TestEmail } from "../models/test-email.model.js";
import mongoose from "mongoose";
import { z } from "zod";
import { Domain, SenderIdentity } from "../models/mailTransport.model.js";
import { ApiError } from "../utils/apiError.js";
import { getOrBuildTransport } from "../transports/index.js";

export async function sendTemplateTest(
  organizationId: string,
  senderId: string,
  recipient: string,
  requestId: string,
  message: { subject: string; html: string; text: string },
) {
  const sender = await SenderIdentity.findOne({ _id: senderId, organizationId });
  if (!sender) throw new ApiError(404, "Sender not found");
  const domain = await Domain.findOne({
    _id: sender.domainId, organizationId,
    name: sender.fromEmail.split("@").at(-1), verified: true,
  });
  if (!domain) throw new ApiError(400, "Sync the sender’s verified domain in Settings before sending.");
  if (!z.string().email().safeParse(recipient).success || /[\r\n<>]/.test(sender.displayName)) {
    throw new ApiError(400, "Check the account email and sender name before sending.");
  }
  try {
    const transport = await getOrBuildTransport(String(domain.transportId), organizationId);
    const result = await transport.send({
      html: message.html,
      text: message.text,
      from: `${sender.displayName} <${sender.fromEmail}>`,
      to: recipient,
      subject: `[Test] ${message.subject}`,
      replyTo: sender.replyTo,
      idempotencyKey: `template-test/${organizationId}/${requestId}`,
    });
    if (mongoose.connection.readyState === 1) await TestEmail.updateOne({ organizationId, requestId }, { $set: { recipient, providerMessageId: result.providerMessageId, status: "SENT" } }, { upsert: true });
  return { id: result.providerMessageId, recipient };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Could not confirm the test send. Retry the same request to avoid a duplicate.");
  }
}
