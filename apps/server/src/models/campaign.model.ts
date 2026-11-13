import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_PRIORITIES,
  RECIPIENT_STATUSES,
  type CampaignStatus,
  type CampaignPriority,
  type RecipientStatus,
} from "../lib/enums.js";

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
  providerMessageId?: string;
  error?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  bouncedAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
}

const campaignRecipientSchema = new Schema<ICampaignRecipient>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: [...RECIPIENT_STATUSES], default: "QUEUED" },
    providerMessageId: String,
    error: String,
    sentAt: Date,
    deliveredAt: Date,
    bouncedAt: Date,
    openedAt: Date,
    clickedAt: Date,
  },
  schemaOptions,
);
campaignRecipientSchema.index({ campaignId: 1, status: 1 });
campaignRecipientSchema.index({ organizationId: 1, email: 1, campaignId: 1 }, { unique: true });
export const CampaignRecipient = model<ICampaignRecipient>(
  "CampaignRecipient",
  campaignRecipientSchema,
);
