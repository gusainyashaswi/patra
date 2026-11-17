import { Contact, List } from "../models/audience.model.js";
import { suppressionRepo } from "./suppression.repo.js";
import { Types } from "mongoose";

export interface BulkImportItem {
  email: string;
  name?: string;
  customFields?: Record<string, string>;
}

export const contactRepo = {
  bulkImport: async (
    organizationId: string,
    contacts: BulkImportItem[],
    duplicateHandling: "skip" | "update" = "skip",
    listName?: string,
  ) => {
    if (!contacts.length) {
      return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    const orgObjectId = new Types.ObjectId(organizationId);

    // 1. Identify and exclude suppressed emails
    const allEmails = contacts.map((c) => c.email.toLowerCase().trim());
    const suppressedSet = await suppressionRepo.findSuppressedEmails(organizationId, allEmails);

    const eligibleContacts = contacts.filter(
      (c) => !suppressedSet.has(c.email.toLowerCase().trim()),
    );
    const suppressedCount = contacts.length - eligibleContacts.length;

    if (!eligibleContacts.length) {
      return {
        created: 0,
        updated: 0,
        skipped: suppressedCount,
        suppressed: suppressedCount,
        total: contacts.length,
      };
    }

    // 2. Build bulkWrite operations
    const operations: any[] = eligibleContacts.map((c) => {
      const email = c.email.toLowerCase().trim();
      const updateData: Record<string, unknown> = {};
      if (c.name !== undefined) updateData.name = c.name;
      if (c.customFields) updateData.customFields = c.customFields;

      if (duplicateHandling === "update") {
        return {
          updateOne: {
            filter: { organizationId: orgObjectId, email },
            update: {
              $set: updateData,
              $setOnInsert: { organizationId: orgObjectId, email },
            },
            upsert: true,
          },
        };
      } else {
        // Skip existing
        return {
          updateOne: {
            filter: { organizationId: orgObjectId, email },
            update: {
              $setOnInsert: {
                organizationId: orgObjectId,
                email,
                name: c.name,
                customFields: c.customFields || {},
              },
            },
            upsert: true,
          },
        };
      }
    });

    const bulkResult = await Contact.bulkWrite(operations, { ordered: false });
    const upsertedCount = bulkResult.upsertedCount || 0;
    const modifiedCount = bulkResult.modifiedCount || 0;
    const matchedCount = bulkResult.matchedCount || 0;

    let skipped = suppressedCount;
    if (duplicateHandling === "skip") {
      skipped += matchedCount;
    }

    // 3. If a listName is provided, add contacts to this list
    let createdList = null;
    if (listName && eligibleContacts.length > 0) {
      const eligibleEmails = eligibleContacts.map((c) => c.email.toLowerCase().trim());
      const contactIds = (await Contact.find({
        organizationId: orgObjectId,
        email: { $in: eligibleEmails },
      }).distinct("_id")) as Types.ObjectId[];

      createdList = await List.create({
        organizationId: orgObjectId,
        name: listName.trim(),
        contactIds,
      });
    }

    return {
      created: upsertedCount,
      updated: duplicateHandling === "update" ? modifiedCount : 0,
      skipped,
      suppressed: suppressedCount,
      total: contacts.length,
      list: createdList
        ? {
            id: createdList.id,
            name: createdList.name,
            count: createdList.contactIds.length,
          }
        : null,
    };
  },

  list: async (
    organizationId: string,
    options: {
      search?: string;
      listId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) => {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const orgObjectId = new Types.ObjectId(organizationId);
    const filter: Record<string, unknown> = { organizationId: orgObjectId };

    if (options.listId) {
      const listDoc = await List.findOne({
        _id: new Types.ObjectId(options.listId),
        organizationId: orgObjectId,
      });
      if (listDoc) {
        filter._id = { $in: listDoc.contactIds };
      } else {
        return { items: [], total: 0, page, limit, totalPages: 0 };
      }
    }

    if (options.search) {
      const regex = new RegExp(options.search.trim(), "i");
      filter.$or = [{ email: regex }, { name: regex }];
    }

    const [items, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Contact.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  findById: async (organizationId: string, id: string) => {
    return Contact.findOne({
      _id: new Types.ObjectId(id),
      organizationId: new Types.ObjectId(organizationId),
    }).lean();
  },

  create: async (
    organizationId: string,
    data: {
      email: string;
      name?: string;
      customFields?: Record<string, string>;
      listIds?: string[];
    },
  ) => {
    const orgObjectId = new Types.ObjectId(organizationId);
    const email = data.email.toLowerCase().trim();

    const contact = await Contact.create({
      organizationId: orgObjectId,
      email,
      name: data.name,
      customFields: data.customFields || {},
    });

    if (data.listIds && data.listIds.length) {
      const listObjectIds = data.listIds.map((lid) => new Types.ObjectId(lid));
      await List.updateMany(
        { _id: { $in: listObjectIds }, organizationId: orgObjectId },
        { $addToSet: { contactIds: contact._id } },
      );
    }

    return contact;
  },

  listLists: async (organizationId: string) => {
    const orgObjectId = new Types.ObjectId(organizationId);
    const lists = await List.find({ organizationId: orgObjectId }).sort({ name: 1 }).lean();
    return lists.map((l) => ({
      id: l._id.toString(),
      name: l.name,
      count: l.contactIds?.length || 0,
      createdAt: (l as any).createdAt,
    }));
  },

  findListById: async (organizationId: string, listId: string) => {
    return List.findOne({
      _id: new Types.ObjectId(listId),
      organizationId: new Types.ObjectId(organizationId),
    }).lean();
  },
};
