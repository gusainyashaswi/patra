import { Resend } from "resend";
import {
  type IMailTransportAdapter,
  type MailMessage,
  type SendResult,
  TransientError,
  PermanentError,
} from "./transport.interface.js";

export class ResendTransport implements IMailTransportAdapter {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: MailMessage): Promise<SendResult> {
    try {
      const response = await this.client.emails.send(
        {
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
          headers: message.headers,
        },
        {
          idempotencyKey: message.idempotencyKey,
        },
      );

      if (response.error) {
        const errMsg = response.error.message || "Resend error";
        const name = (response.error as { name?: string }).name || "";
        // Distinguish permanent vs transient based on error name / type
        if (
          name.includes("validation") ||
          name.includes("missing_required_field") ||
          name.includes("invalid_parameter") ||
          name.includes("restricted_api_key")
        ) {
          throw new PermanentError(`Resend permanent error: ${errMsg}`);
        }
        if (name.includes("rate_limit") || name.includes("daily_quota")) {
          throw new TransientError(`Resend rate limit: ${errMsg}`);
        }
        // Unknown provider error treated as transient
        throw new TransientError(`Resend transient error: ${errMsg}`);
      }

      if (!response.data?.id) {
        throw new TransientError("Resend response missing message ID");
      }

      return {
        providerMessageId: response.data.id,
      };
    } catch (error) {
      if (error instanceof PermanentError || error instanceof TransientError) {
        throw error;
      }

      const errString = error instanceof Error ? error.message : String(error);
      if (
        /400|404|422|validation|invalid email|unverified domain/i.test(errString)
      ) {
        throw new PermanentError(`Resend rejected email: ${errString}`);
      }

      // Default unknown errors to TransientError
      throw new TransientError(`Resend dispatch error: ${errString}`);
    }
  }

  async verify(): Promise<boolean> {
    try {
      const res = await this.client.domains.list();
      return !res.error;
    } catch {
      return false;
    }
  }
}
