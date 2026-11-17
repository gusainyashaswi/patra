import { z } from "zod";
import { decrypt } from "../lib/crypto.js";
import { Domain, SenderIdentity } from "../models/mailTransport.model.js";
import { ApiError } from "../utils/apiError.js";
import { getResendTransport } from "./resend.service.js";

export async function sendTemplateTest(
  organizationId: string,
  senderId: string,
  recipient: string,
  requestId: string,
  message: { subject: string; html: string; text: string },
) {
  const sender = await SenderIdentity.findOne({ _id: senderId, organizationId });
  if (!sender) throw new ApiError(404, "Sender not found");
  const verified = await Domain.exists({
    _id: sender.domainId, organizationId, transportId: sender.transportId,
    name: sender.fromEmail.split("@").at(-1), verified: true,
  });
  if (!verified) throw new ApiError(400, "Sync the sender’s verified domain in Settings before sending.");
  const transport = await getResendTransport(organizationId, String(sender.transportId));
  if (transport.status !== "VERIFIED") throw new ApiError(400, "Test the transport connection in Settings first.");
  if (!z.string().email().safeParse(recipient).success || /[\r\n<>]/.test(sender.displayName)) {
    throw new ApiError(400, "Check the account email and sender name before sending.");
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${decrypt(transport.credentialsEncrypted)}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `template-test/${organizationId}/${requestId}`,
      },
      body: JSON.stringify({
        html: message.html, text: message.text, from: `${sender.displayName} <${sender.fromEmail}>`, to: [recipient],
        subject: `[Test] ${message.subject}`, reply_to: sender.replyTo,
      }),
    });
    if (!response.ok) throw new ApiError(502, `Resend rejected the test send (HTTP ${response.status}). Check the key and sender in Settings.`);
    const { id } = z.object({ id: z.string().min(1) }).parse(await response.json());
    return { id, recipient };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Could not confirm the test send. Retry the same request to avoid a duplicate.");
  }
}
