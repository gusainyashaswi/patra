import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";
import {
  TRANSPORT_TYPES,
  TRANSPORT_STATUSES,
  type TransportType,
  type TransportStatus,
} from "../lib/enums.js";

export interface IMailTransport {
  organizationId: Types.ObjectId;
  name: string;
  type: TransportType;
  credentialsEncrypted: string;
  ratePerSecond: number;
  dailyLimit?: number;
  isDefault: boolean;
  status: TransportStatus;
  lastTestedAt?: Date;
}

const mailTransportSchema = new Schema<IMailTransport>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    type: { type: String, enum: [...TRANSPORT_TYPES], required: true },
    credentialsEncrypted: { type: String, required: true, select: false },
    ratePerSecond: { type: Number, default: 2 },
    dailyLimit: Number,
    isDefault: { type: Boolean, default: false },
    status: { type: String, enum: [...TRANSPORT_STATUSES], default: "UNVERIFIED" },
    lastTestedAt: Date,
  },
  schemaOptions,
);

export const MailTransport = model<IMailTransport>("MailTransport", mailTransportSchema);

export interface IDomain {
  organizationId: Types.ObjectId;
  transportId: Types.ObjectId;
  name: string;
  verified: boolean;
  providerDomainId?: string;
  dnsRecords?: unknown;
}

const domainSchema = new Schema<IDomain>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    transportId: { type: Schema.Types.ObjectId, ref: "MailTransport", required: true },
    name: { type: String, required: true, lowercase: true, trim: true },
    verified: { type: Boolean, default: false },
    providerDomainId: String,
    dnsRecords: Schema.Types.Mixed,
  },
  schemaOptions,
);
domainSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export const Domain = model<IDomain>("Domain", domainSchema);

export interface ISenderIdentity {
  organizationId: Types.ObjectId;
  transportId: Types.ObjectId;
  domainId: Types.ObjectId;
  displayName: string;
  fromEmail: string;
  replyTo?: string;
  isDefault: boolean;
}

const senderIdentitySchema = new Schema<ISenderIdentity>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    transportId: { type: Schema.Types.ObjectId, ref: "MailTransport", required: true },
    domainId: { type: Schema.Types.ObjectId, ref: "Domain", required: true },
    displayName: { type: String, required: true },
    fromEmail: { type: String, required: true, lowercase: true, trim: true },
    replyTo: { type: String, lowercase: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  schemaOptions,
);
export const SenderIdentity = model<ISenderIdentity>("SenderIdentity", senderIdentitySchema);
