import { z } from "zod";
import { PermanentError, type IMailTransportAdapter, type MailMessage, type SendResult } from "../../transports/transport.interface.js";

// Test-only adapter: it can only use Mailtrap's sandbox and .test recipients.
export class MailtrapSandbox implements IMailTransportAdapter {
  readonly accepted = new Map<string, SendResult>();
  constructor(private token: string, private inbox: string) {
    if (process.env.NODE_ENV !== "test" || !token || !/^\d+$/.test(inbox)) throw new Error("Mailtrap load checks require test mode, a sandbox token, and numeric inbox ID");
  }
  async verify() { return true; }
  async send(message: MailMessage): Promise<SendResult> {
    if (!message.to.endsWith("@example.test")) throw new PermanentError("Load test recipients must use example.test");
    const previous = this.accepted.get(message.idempotencyKey);
    if (previous) return previous;
    try {
      const response = await fetch(`https://sandbox.api.mailtrap.io/api/send/${this.inbox}`, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: { email: message.from.match(/<([^>]+)>$/)?.[1] ?? message.from }, to: [{ email: message.to }], subject: message.subject, html: message.html, text: message.text, category: "Patra isolated queue load" }),
      });
      if (!response.ok) throw new Error(`Mailtrap sandbox returned HTTP ${response.status}`);
      const result = z.object({ success: z.literal(true), message_ids: z.array(z.string().min(1)).min(1) }).parse(await response.json());
      const sent = { providerMessageId: result.message_ids[0] };
      this.accepted.set(message.idempotencyKey, sent);
      return sent;
    } catch {
      // Don't retry uncertain sandbox sends: this harness does not assume that
      // Mailtrap supports Resend's idempotency semantics.
      throw new PermanentError("Mailtrap sandbox request failed; check its limits and inbox before rerunning");
    }
  }
}
