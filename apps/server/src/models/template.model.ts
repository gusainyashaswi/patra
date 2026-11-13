import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";
import { TEMPLATE_STATUSES, type TemplateStatus } from "../lib/enums.js";

export interface ITemplate {
  organizationId: Types.ObjectId;
  name: string;
  status: TemplateStatus;
  draftBlocks?: unknown;
}

const templateSchema = new Schema<ITemplate>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    status: { type: String, enum: [...TEMPLATE_STATUSES], default: "DRAFT" },
    draftBlocks: Schema.Types.Mixed,
  },
  schemaOptions,
);
export const Template = model<ITemplate>("Template", templateSchema);

export interface ITemplateVersion {
  templateId: Types.ObjectId;
  organizationId: Types.ObjectId;
  version: number;
  subject: string;
  previewText?: string;
  blocks: unknown;
  html: string;
  text: string;
  variables: string[];
}

const templateVersionSchema = new Schema<ITemplateVersion>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    version: { type: Number, required: true },
    subject: { type: String, required: true },
    previewText: String,
    blocks: { type: Schema.Types.Mixed, required: true },
    html: { type: String, required: true },
    text: { type: String, required: true },
    variables: { type: [String], default: [] },
  },
  schemaOptions,
);
templateVersionSchema.index({ templateId: 1, version: 1 }, { unique: true });
export const TemplateVersion = model<ITemplateVersion>("TemplateVersion", templateVersionSchema);
