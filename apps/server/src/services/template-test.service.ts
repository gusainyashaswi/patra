import { decrypt } from "../lib/crypto.js";
import { getResendTransport } from "./resend.service.js";
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

// Sandbox delivery never creates a verified domain or enables campaign sending.
export async function sendSandboxTemplateTest(
  organizationId: string, transportId: string, recipient: string, requestId: string,
  message: { subject: string; html: string; text: string },
) {
  const transport = await getResendTransport(organizationId, transportId);
  if (!z.string().email().safeParse(recipient).success) throw new ApiError(400, "Check your account email before sending.");
  return deliverTest(organizationId, recipient, requestId, transport.credentialsEncrypted, message,
    "Patra Sandbox <onboarding@resend.dev>");
}

async function deliverTest(
  organizationId: string, recipient: string, requestId: string, credentials: string,
  message: { subject: string; html: string; text: string }, from: string, replyTo?: string,
) {
  const previous = await TestEmail.findOne({ organizationId, requestId });
  if (previous?.providerMessageId) return { id: previous.providerMessageId, recipient: previous.recipient };
  await TestEmail.updateOne({ organizationId, requestId }, { $setOnInsert: { recipient } }, { upsert: true });
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${decrypt(credentials)}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `template-test/${organizationId}/${requestId}`,
      },
      body: JSON.stringify({
        html: message.html, text: message.text, from, to: [recipient],
        subject: `[Test] ${message.subject}`, reply_to: replyTo,
      }),
    });
    if (!response.ok) throw new ApiError(502, `Resend rejected the test send (HTTP ${response.status}). Sandbox tests can only reach your Resend account email; otherwise check the key and verified sender in Settings.`);
    const { id } = z.object({ id: z.string().min(1) }).parse(await response.json());
    await TestEmail.updateOne({ organizationId, requestId }, { $set: { providerMessageId: id, status: "SENT" } });
    return { id, recipient };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Could not confirm the test send. Retry the same request to avoid a duplicate.");
  }
}
