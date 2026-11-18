import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";
import { SUPPRESSION_REASONS, type SuppressionReason } from "@patra/shared/enums";

export interface IContact {
  organizationId: Types.ObjectId;
  email: string;
  name?: string;
  customFields: Record<string, string>;
}
const contactSchema = new Schema<IContact>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  schemaOptions,
);
contactSchema.index({ organizationId: 1, email: 1 }, { unique: true });
export const Contact = model<IContact>("Contact", contactSchema);

export interface IList {
  organizationId: Types.ObjectId;
  name: string;
  contactIds: Types.ObjectId[];
  importKey?: string;
}
const listSchema = new Schema<IList>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    importKey: String,
    contactIds: { type: [Schema.Types.ObjectId], ref: "Contact", default: [] },
  },
  schemaOptions,
);
listSchema.index({ organizationId: 1, importKey: 1 }, { unique: true, partialFilterExpression: { importKey: { $type: "string" } } });
export const List = model<IList>("List", listSchema);

export interface ISuppression {
  organizationId: Types.ObjectId;
  email: string;
  reason: SuppressionReason;
}
const suppressionSchema = new Schema<ISuppression>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: {
      type: String,
      enum: [...SUPPRESSION_REASONS],
      required: true,
    },
  },
  schemaOptions,
);
suppressionSchema.index({ organizationId: 1, email: 1 }, { unique: true });
export const Suppression = model<ISuppression>("Suppression", suppressionSchema);
