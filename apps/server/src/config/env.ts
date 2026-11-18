import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5001),
  NODE_ENV: z.string().default("development"),
  MONGODB_URI: z.string().optional(),
  MONGO_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  ACCESS_TOKEN_SECRET: z.string().min(32).optional(),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),
  REFRESH_TOKEN_SECRET: z.string().min(32).optional(),
  REFRESH_TOKEN_EXPIRY: z.string().default("10d"),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().optional(),
  CREDENTIALS_KEY: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = schema.parse(process.env);

function requireSecret(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} must be set to a strong secret before the server starts`);
  }
  return value;
}

const accessTokenSecret = requireSecret(
  "ACCESS_TOKEN_SECRET",
  parsed.ACCESS_TOKEN_SECRET || parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET,
);
const refreshTokenSecret = requireSecret(
  "REFRESH_TOKEN_SECRET",
  parsed.REFRESH_TOKEN_SECRET || parsed.JWT_REFRESH_SECRET,
);
const credentialsKey = requireSecret(
  "CREDENTIALS_KEY",
  parsed.CREDENTIALS_KEY || parsed.ENCRYPTION_KEY,
);

export const env = {
  PORT: parsed.PORT,
  NODE_ENV: parsed.NODE_ENV,
  MONGODB_URI: parsed.MONGODB_URI || parsed.MONGO_URL || "mongodb://localhost:27017/patra",
  MONGO_URL: parsed.MONGO_URL || parsed.MONGODB_URI || "mongodb://localhost:27017/patra",
  REDIS_URL: parsed.REDIS_URL,
  WORKER_CONCURRENCY: parsed.WORKER_CONCURRENCY,
  ACCESS_TOKEN_SECRET: accessTokenSecret,
  ACCESS_TOKEN_EXPIRY: parsed.ACCESS_TOKEN_EXPIRY || parsed.JWT_EXPIRES_IN || "1d",
  REFRESH_TOKEN_SECRET: refreshTokenSecret,
  REFRESH_TOKEN_EXPIRY: parsed.REFRESH_TOKEN_EXPIRY || parsed.JWT_REFRESH_EXPIRES_IN || "10d",
  JWT_ACCESS_SECRET: accessTokenSecret,
  JWT_REFRESH_SECRET: refreshTokenSecret,
  CREDENTIALS_KEY: credentialsKey,
  ENCRYPTION_KEY: credentialsKey,
  CORS_ORIGIN: parsed.CORS_ORIGIN,
};
