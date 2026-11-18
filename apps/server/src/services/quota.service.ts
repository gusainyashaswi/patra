import mongoose, { Schema, model } from "mongoose";
import { CampaignRecipient } from "../models/campaign.model.js";
const quotaSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, required: true },
  transportId: { type: Schema.Types.ObjectId, required: true },
  day: { type: String, required: true },
  used: { type: Number, default: 0 },
});
quotaSchema.index({ organizationId: 1, transportId: 1, day: 1 }, { unique: true });
export const DailyQuota = model("DailyQuota", quotaSchema);

export async function reserveQuota(organizationId: string, transportId: string, recipientId: string, limit: number, now = new Date()): Promise<boolean> {
  if (!limit) return true;
  const day = now.toISOString().slice(0, 10);
  const scope = { organizationId, transportId, day };
  // Establish the shared counter outside the transaction to avoid competing upserts.
  try { await DailyQuota.updateOne(scope, { $setOnInsert: { used: 0 } }, { upsert: true }); }
  catch (error) { if ((error as { code?: number }).code !== 11000) throw error; }
  let reserved = false;
  await mongoose.connection.transaction(async session => {
    reserved = false;
    const recipient = await CampaignRecipient.findOne({ _id: recipientId, organizationId }).session(session);
    if (!recipient) return;
    if (recipient.quotaDay === day) { reserved = true; return; }
    const result = await DailyQuota.updateOne({ ...scope, used: { $lt: limit } }, { $inc: { used: 1 } }, { session });
    if (!result.modifiedCount) return;
    recipient.quotaDay = day;
    await recipient.save({ session });
    reserved = true;
  });
  return reserved;
}
export function nextUtcDay(now = new Date()) {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}
