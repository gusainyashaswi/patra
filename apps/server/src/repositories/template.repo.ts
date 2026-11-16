import {
  Template,
  TemplateVersion,
  type ITemplate,
  type ITemplateDraft,
} from "../models/template.model.js";

export const templateRepo = {
  list: async (organizationId: string) => {
    return Template.find({ organizationId }).sort({ updatedAt: -1 }).lean();
  },

  findById: async (organizationId: string, id: string) => {
    return Template.findOne({ _id: id, organizationId }).lean();
  },

  findWithVersions: async (organizationId: string, id: string) => {
    const template = await Template.findOne({ _id: id, organizationId }).lean();
    if (!template) return null;

    const versions = await TemplateVersion.find({ organizationId, templateId: id })
      .sort({ version: -1 })
      .lean();

    return {
      ...template,
      versions,
    };
  },

  create: async (organizationId: string, data: { name: string; draft: ITemplateDraft }) => {
    return Template.create({
      organizationId,
      name: data.name,
      status: "DRAFT",
      latestVersion: 0,
      draft: data.draft,
    });
  },

  updateDraft: async (
    organizationId: string,
    id: string,
    patch: { name?: string; draft?: ITemplateDraft },
  ) => {
    const updateFields: Record<string, unknown> = {};
    if (patch.name !== undefined) updateFields.name = patch.name;
    if (patch.draft !== undefined) updateFields.draft = patch.draft;

    return Template.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: updateFields },
      { new: true },
    ).lean();
  },

  publishVersion: async (
    organizationId: string,
    id: string,
    versionData: {
      subject: string;
      previewText?: string;
      blocks: unknown;
      html: string;
      text: string;
      variables: string[];
    },
  ) => {
    // 1. Atomically increment latestVersion on the template
    const updated = await Template.findOneAndUpdate(
      { _id: id, organizationId },
      { $inc: { latestVersion: 1 }, $set: { status: "PUBLISHED" } },
      { new: true },
    ).lean();

    if (!updated) return null;

    // 2. Insert the immutable TemplateVersion document
    const versionDoc = await TemplateVersion.create({
      templateId: id,
      organizationId,
      version: updated.latestVersion,
      subject: versionData.subject,
      previewText: versionData.previewText,
      blocks: versionData.blocks,
      html: versionData.html,
      text: versionData.text,
      variables: versionData.variables,
    });

    return {
      template: updated,
      version: versionDoc.toObject ? versionDoc.toObject() : versionDoc,
    };
  },

  getVersions: async (organizationId: string, templateId: string) => {
    return TemplateVersion.find({ organizationId, templateId }).sort({ version: -1 }).lean();
  },

  getVersion: async (organizationId: string, templateId: string, version: number) => {
    return TemplateVersion.findOne({ organizationId, templateId, version }).lean();
  },
};
