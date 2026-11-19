import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default("development"),
  MONGODB_URI: z.string().optional(),
  MONGO_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  ACCESS_TOKEN_SECRET: z.string().optional(),
  ACCESS_TOKEN_EXPIRY: z.string().default("1d"),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  REFRESH_TOKEN_EXPIRY: z.string().default("10d"),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().optional(),
  CREDENTIALS_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  console.error("❌ Environment variable validation failed:", JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}
const parsed = result.data;

const defaultCredentialsKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const defaultAccessSecret = "patra_jwt_access_secret_super_secure_key_123456789";
const defaultRefreshSecret = "patra_jwt_refresh_secret_super_secure_key_987654321";

export const env = {
  PORT: parsed.PORT,
  NODE_ENV: parsed.NODE_ENV,
  MONGODB_URI: parsed.MONGODB_URI || parsed.MONGO_URL || "mongodb://localhost:27017/patra",
  MONGO_URL: parsed.MONGO_URL || parsed.MONGODB_URI || "mongodb://localhost:27017/patra",
  REDIS_URL: parsed.REDIS_URL,
  WORKER_CONCURRENCY: parsed.WORKER_CONCURRENCY,
  ACCESS_TOKEN_SECRET:
    parsed.ACCESS_TOKEN_SECRET ||
    parsed.JWT_ACCESS_SECRET ||
    parsed.JWT_SECRET ||
    defaultAccessSecret,
  ACCESS_TOKEN_EXPIRY: parsed.ACCESS_TOKEN_EXPIRY || parsed.JWT_EXPIRES_IN || "1d",
  REFRESH_TOKEN_SECRET:
    parsed.REFRESH_TOKEN_SECRET || parsed.JWT_REFRESH_SECRET || defaultRefreshSecret,
  REFRESH_TOKEN_EXPIRY: parsed.REFRESH_TOKEN_EXPIRY || parsed.JWT_REFRESH_EXPIRES_IN || "10d",
  JWT_ACCESS_SECRET:
    parsed.JWT_ACCESS_SECRET ||
    parsed.ACCESS_TOKEN_SECRET ||
    parsed.JWT_SECRET ||
    defaultAccessSecret,
  JWT_REFRESH_SECRET:
    parsed.JWT_REFRESH_SECRET || parsed.REFRESH_TOKEN_SECRET || defaultRefreshSecret,
  CREDENTIALS_KEY:
    parsed.CREDENTIALS_KEY && parsed.CREDENTIALS_KEY.length === 64
      ? parsed.CREDENTIALS_KEY
      : parsed.ENCRYPTION_KEY && parsed.ENCRYPTION_KEY.length === 64
        ? parsed.ENCRYPTION_KEY
        : defaultCredentialsKey,
  ENCRYPTION_KEY:
    parsed.ENCRYPTION_KEY && parsed.ENCRYPTION_KEY.length === 64
      ? parsed.ENCRYPTION_KEY
      : parsed.CREDENTIALS_KEY && parsed.CREDENTIALS_KEY.length === 64
        ? parsed.CREDENTIALS_KEY
        : defaultCredentialsKey,
  CORS_ORIGIN: parsed.CORS_ORIGIN,
};
