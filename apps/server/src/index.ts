import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { connectDB } from "./db/index.js";
import { env } from "./config/env.js";

const PORT = process.env.PORT || env.PORT || 5001;

async function startServer(): Promise<void> {
  const database = await connectDB();
  if (!database && env.NODE_ENV === "production") {
    throw new Error("Refusing to start in production because MongoDB is unavailable");
  }

  if (!database) {
    console.warn("Starting without MongoDB; readiness checks will remain unavailable.");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Patra API server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Patra API server:", err);
  process.exitCode = 1;
});
