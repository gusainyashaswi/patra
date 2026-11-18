import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export const connectDB = async (): Promise<typeof mongoose | null> => {
  try {
    const rawUri = process.env.MONGODB_URI || process.env.MONGO_URL;

    if (
      !rawUri ||
      rawUri.includes("<username>") ||
      rawUri.includes("<password>") ||
      rawUri.includes("YOUR_MONGO_URL") ||
      rawUri.includes("YOUR_MONGODB_URI")
    ) {
      console.warn("⚠️  MongoDB connection string is a placeholder or not configured.");
      console.warn(
        "👉 Set a valid MONGODB_URI in apps/server/.env when you are ready to connect to your database.",
      );
      return null;
    }

    let connectionUri = rawUri;
    // Append DB_NAME if not standard mongodb+srv:// with existing db name or simple URI without path
    if (
      !connectionUri.startsWith("mongodb+srv://") &&
      !connectionUri.split("?")[0].includes(`/${DB_NAME}`)
    ) {
      const [basePart, queryPart] = connectionUri.split("?");
      const baseWithDb = basePart.endsWith("/")
        ? `${basePart}${DB_NAME}`
        : `${basePart}/${DB_NAME}`;
      connectionUri = queryPart ? `${baseWithDb}?${queryPart}` : baseWithDb;
    }

    const connectionInstance = await mongoose.connect(connectionUri, { autoIndex: process.env.NODE_ENV !== "production" });
    console.log(
      `✅ MongoDB connected successfully! Host: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`,
    );
    return connectionInstance;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    return null;
  }
};

export default connectDB;
