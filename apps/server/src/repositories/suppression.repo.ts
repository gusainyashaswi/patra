import { Suppression } from "../models/audience.model.js";
import { AuditLog } from "../models/infra.model.js";
import type { SuppressionReason } from "../lib/enums.js";
import { Types } from "mongoose";

export const suppressionRepo = {
  isSuppressed: async (organizationId: string, email: string): Promise<boolean> => {
    const found = await Suppression.exists({
      organizationId: new Types.ObjectId(organizationId),
      email: email.toLowerCase().trim(),
    });
    return !!found;
  },

  findSuppressedEmails: async (organizationId: string, emails: string[]): Promise<Set<string>> => {
    if (!emails.length) return new Set();

    const normalized = emails.map((e) => e.toLowerCase().trim());
    const records = await Suppression.find({
      organizationId: new Types.ObjectId(organizationId),
      email: { $in: normalized },
    })
      .select("email")
      .lean();

    return new Set(records.map((r) => r.email.toLowerCase()));
  },

  list: async (organizationId: string, options: { page?: number; limit?: number } = {}) => {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Suppression.find({ organizationId: new Types.ObjectId(organizationId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Suppression.countDocuments({ organizationId: new Types.ObjectId(organizationId) }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  add: async (
    organizationId: string,
    email: string,
    reason: SuppressionReason = "MANUAL",
    userId?: string | Types.ObjectId,
  ) => {
    const normalized = email.toLowerCase().trim();
    const orgObjectId = new Types.ObjectId(organizationId);

    const doc = await Suppression.findOneAndUpdate(
      { organizationId: orgObjectId, email: normalized },
      { $set: { reason } },
      { upsert: true, new: true },
    ).lean();

    // Audit log per PRD Section 5.4
    await AuditLog.create({
      organizationId: orgObjectId,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      action: "suppression.added",
      targetType: "Suppression",
      targetId: normalized,
      metadata: { reason },
    });

    return doc;
  },

  remove: async (organizationId: string, email: string, userId?: string | Types.ObjectId) => {
    const normalized = email.toLowerCase().trim();
    const orgObjectId = new Types.ObjectId(organizationId);

    const deleted = await Suppression.findOneAndDelete({
      organizationId: orgObjectId,
      email: normalized,
    }).lean();

    if (deleted) {
      // Audit log per PRD Section 5.4
      await AuditLog.create({
        organizationId: orgObjectId,
        userId: userId ? new Types.ObjectId(userId) : undefined,
        action: "suppression.removed",
        targetType: "Suppression",
        targetId: normalized,
        metadata: { previousReason: deleted.reason },
      });
    }

    return deleted;
  },
};
