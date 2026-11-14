import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import { connectDB } from "./db/index.js";
import { env } from "./config/env.js";

const PORT = process.env.PORT || env.PORT || 5001;

// Connect to MongoDB and start listening
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Patra API server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    app.listen(PORT, () => {
      console.log(`🚀 Patra API server running in fallback mode on http://localhost:${PORT}`);
    });
  });
