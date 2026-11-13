import express from "express";
import { errorHandler } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.routes.js";
import { transportRouter } from "./routes/transports.routes.js";

export const app = express();
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRouter);
app.use("/api/orgs/:orgId/transports", transportRouter);

app.use(errorHandler);
