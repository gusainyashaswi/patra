import mongoose from "mongoose";
import { connectDB } from "../db/index.js";
import { SenderIdentity } from "../models/mailTransport.model.js";

async function main() {
  const connection = await connectDB();
  if (!connection) throw new Error("MongoDB is required to remove the legacy sender transportId field");
  const result = await SenderIdentity.collection.updateMany(
    { transportId: { $exists: true } },
    { $unset: { transportId: "" } },
  );
  console.log(`Removed legacy transportId from ${result.modifiedCount} sender identities.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
