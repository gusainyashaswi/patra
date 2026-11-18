import { Schema, model } from "mongoose";
const schema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, required: true },
  requestId: { type: String, required: true },
  recipient: { type: String, required: true },
  providerMessageId: { type: String, index: true },
  status: { type: String, default: "PENDING" },
}, { timestamps: true });
schema.index({ organizationId: 1, requestId: 1 }, { unique: true });
export const TestEmail = model("TestEmail", schema);
