import { TransientError, PermanentError } from "../lib/errors.js";

export { TransientError, PermanentError };

export interface MailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
  idempotencyKey: string;
}

export interface SendResult {
  providerMessageId: string;
}

export interface IMailTransportAdapter {
  send(message: MailMessage): Promise<SendResult>;
  verify(): Promise<boolean>;
}
