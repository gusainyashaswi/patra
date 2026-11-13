import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";

export interface IWebhookEvent {
  provider: string;
  providerEventId: string;
  type: string;
  payload: unknown;
  receivedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: { type: String, required: true },
    providerEventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    payload: Schema.Types.Mixed,
    receivedAt: { type: Date, default: Date.now },
  },
  { ...schemaOptions, timestamps: false },
);
webhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
export const WebhookEvent = model<IWebhookEvent>("WebhookEvent", webhookEventSchema);

export interface IAuditLog {
  organizationId: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: unknown;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: String,
    metadata: Schema.Types.Mixed,
  },
  schemaOptions,
);
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
