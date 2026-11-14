import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { transportRouter } from "./routes/transports.routes.js";
import { env } from "./config/env.js";

export const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
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
app.use("/api/auth", authRouter);
app.use("/api/orgs/:orgId/transports", transportRouter);

// Central Error Handler
app.use(errorHandler);
