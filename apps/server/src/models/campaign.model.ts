import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_PRIORITIES,
  RECIPIENT_STATUSES,
  type CampaignStatus,
  type CampaignPriority,
  type RecipientStatus,
} from "@patra/shared/enums";

export interface ICampaignCounters {
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  bouncedCount: number;
  failedCount: number;
}

export interface ICampaign {
  organizationId: Types.ObjectId;
  name: string;
  status: CampaignStatus;
  priority: CampaignPriority;
  templateVersionId: Types.ObjectId;
  senderIdentityId: Types.ObjectId;
  listId: Types.ObjectId;
  createdById?: Types.ObjectId;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  dispatch?: { status: "PENDING" | "DISPATCHED"; lastError?: string };
  counters: ICampaignCounters;
}

const campaignSchema = new Schema<ICampaign>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    status: { type: String, enum: [...CAMPAIGN_STATUSES], default: "DRAFT" },
    priority: { type: String, enum: [...CAMPAIGN_PRIORITIES], default: "NORMAL" },
    templateVersionId: { type: Schema.Types.ObjectId, ref: "TemplateVersion", required: true },
    senderIdentityId: { type: Schema.Types.ObjectId, ref: "SenderIdentity", required: true },
    listId: { type: Schema.Types.ObjectId, ref: "List", required: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User" },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    dispatch: { status: { type: String, enum: ["PENDING", "DISPATCHED"] }, lastError: String },
    counters: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      bouncedCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
  },
  schemaOptions,
);
campaignSchema.index({ organizationId: 1, status: 1 });
export const Campaign = model<ICampaign>("Campaign", campaignSchema);

export interface ICampaignRecipient {
  organizationId: Types.ObjectId;
  campaignId: Types.ObjectId;
  contactId: Types.ObjectId;
  email: string;
  status: RecipientStatus;
  requiresReview?: boolean;
  renderedMessage?: { subject: string; html: string; text: string; headers: Record<string, string> };
  quotaDay?: string;
  firstAttemptAt?: Date;
  mergeData?: Record<string, unknown>;
  senderSnapshot?: { displayName: string; fromEmail: string; replyTo?: string };
  providerMessageId?: string;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  bouncedAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failedAt?: Date;
  complainedAt?: Date;
}

const campaignRecipientSchema = new Schema<ICampaignRecipient>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: [...RECIPIENT_STATUSES], default: "QUEUED" },
    requiresReview: Boolean,
    renderedMessage: Schema.Types.Mixed,
    quotaDay: String,
    firstAttemptAt: Date,
    mergeData: Schema.Types.Mixed,
    senderSnapshot: { type: Schema.Types.Mixed },
    providerMessageId: String,
    error: String,
    sentAt: Date,
    deliveredAt: Date,
    bouncedAt: Date,
    openedAt: Date,
    clickedAt: Date,
    failedAt: Date,
    complainedAt: Date,
  },
  schemaOptions,
);
campaignRecipientSchema.index({ status: 1, createdAt: 1 });
campaignRecipientSchema.index({ providerMessageId: 1 });
campaignRecipientSchema.index({ campaignId: 1, status: 1 });
campaignRecipientSchema.index({ campaignId: 1, contactId: 1 }, { unique: true });
campaignRecipientSchema.index({ organizationId: 1, campaignId: 1, status: 1 });
export const CampaignRecipient = model<ICampaignRecipient>(
  "CampaignRecipient",
  campaignRecipientSchema,
);
