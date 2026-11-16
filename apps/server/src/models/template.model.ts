import { Schema, model, type Types } from "mongoose";
import { schemaOptions } from "./base.js";
import { TEMPLATE_STATUSES, type TemplateStatus } from "../lib/enums.js";

export interface ITemplatePageSettings {
  bg?: string;
  width?: number;
  text?: string;
  align?: "left" | "center" | "right";
}

export interface ITemplateDraft {
  subject?: string;
  previewText?: string;
  page?: ITemplatePageSettings;
  blocks?: Array<Record<string, unknown>>;
}

export interface ITemplate {
  organizationId: Types.ObjectId;
  name: string;
  status: TemplateStatus;
  latestVersion: number;
  draft: ITemplateDraft;
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
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: [...TEMPLATE_STATUSES], default: "DRAFT" },
    latestVersion: { type: Number, default: 0 },
    draft: {
      subject: { type: String, default: "" },
      previewText: { type: String, default: "" },
      page: {
        bg: { type: String, default: "#ffffff" },
        width: { type: Number, default: 600 },
        text: { type: String, default: "#1c1917" },
        align: { type: String, default: "left" },
      },
      blocks: { type: [Schema.Types.Mixed], default: [] },
    },
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
templateVersionSchema.index({ organizationId: 1, templateId: 1 });

export const TemplateVersion = model<ITemplateVersion>("TemplateVersion", templateVersionSchema);
