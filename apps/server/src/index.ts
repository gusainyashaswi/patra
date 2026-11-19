import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { connectDB } from "./db/index.js";
import { env } from "./config/env.js";

const PORT = Number(process.env.PORT || env.PORT || 4000);
const HOST = "0.0.0.0";

// Connect to MongoDB and start listening
connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Patra API server running on http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Patra API server running in fallback mode on http://${HOST}:${PORT}`);
    });
  });
