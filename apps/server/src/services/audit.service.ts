import { AuditLog } from "../models/infra.model.js";
import type { ClientSession } from "mongoose";
export async function audit(organizationId: string, userId: string | undefined, action: string, targetType: string, targetId: string, session: ClientSession, metadata?: Record<string, unknown>) {
  await AuditLog.create([{ organizationId, userId, action, targetType, targetId, metadata }], { session });
}
