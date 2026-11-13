import { MailTransport, type IMailTransport } from "../models/mailTransport.model.js";
import type { Types } from "mongoose";

export const transportRepo = {
  list: (orgId: string) =>
    MailTransport.find({ organizationId: orgId }).select("-credentialsEncrypted").lean(),

  findOne: (orgId: string, id: string) =>
    MailTransport.findOne({ _id: id, organizationId: orgId }).lean(),

  create: (orgId: string, data: Omit<IMailTransport, "organizationId">) =>
    MailTransport.create({ ...data, organizationId: orgId }),
};
