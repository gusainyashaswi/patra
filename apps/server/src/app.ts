import express from "express";
import { webhookRouter } from "./routes/webhooks.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { orgRouter } from "./routes/orgs.routes.js";
import { publicImageRouter } from "./routes/uploads.routes.js";
import { env } from "./config/env.js";

import { unsubscribeRouter } from "./routes/unsubscribe.routes.js";

export const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

// Signature verification requires the original bytes, before JSON parsing.
app.use("/api/webhooks", webhookRouter);

const parseJson = express.json({ limit: "16kb" });
app.use((req, res, next) => {
  if (/^\/api\/orgs\/[^/]+\/templates(?:\/|$)/i.test(req.path)) return next();
  parseJson(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Health & Root endpoints
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "WELCOME TO PATRA API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// API Routes
app.use("/api/public/unsubscribe", unsubscribeRouter);
app.use("/api/auth", authRouter);
app.use("/api/orgs", orgRouter);
app.use("/api/uploads", publicImageRouter);

// Central Error Handler
app.use(errorHandler);
