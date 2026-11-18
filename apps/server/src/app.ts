import { browserOrigin } from "./middleware/browser-origin.js";
import { unsubscribeRouter } from "./routes/unsubscribe.routes.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { orgRouter } from "./routes/orgs.routes.js";
import { publicImageRouter } from "./routes/uploads.routes.js";
import { env } from "./config/env.js";
import { isDatabaseReady } from "./db/index.js";
import { webhookRouter } from "./routes/webhooks.routes.js";

export const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

// Svix signs the exact bytes sent by Resend, so this must run before JSON parsing.
app.use("/api/webhooks", webhookRouter);

// Template drafts are the largest JSON requests; use one predictable limit for every API route.
app.use(express.json({ limit: "768kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(browserOrigin);
app.use("/api/public/unsubscribe", unsubscribeRouter);

// Health & Root endpoints
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "WELCOME TO PATRA API" });
});

const liveness = (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok", service: "patra-api" });
};

const readiness = (_req: express.Request, res: express.Response) => {
  const database = isDatabaseReady();
  const status = database ? 200 : 503;

  res.status(status).json({
    status: database ? "ready" : "not_ready",
    dependencies: { mongodb: database ? "ready" : "not_ready" },
  });
};

app.get("/health", liveness);
app.get("/api/health", liveness);
app.get("/ready", readiness);
app.get("/api/ready", readiness);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/orgs", orgRouter);
app.use("/api/uploads", publicImageRouter);

// Central Error Handler
app.use(errorHandler);
