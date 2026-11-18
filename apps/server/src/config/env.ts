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

const parsed = schema.parse(process.env);
if (parsed.NODE_ENV === "production") {
  const access = parsed.ACCESS_TOKEN_SECRET || parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET;
  const refresh = parsed.REFRESH_TOKEN_SECRET || parsed.JWT_REFRESH_SECRET;
  const encryption = parsed.CREDENTIALS_KEY || parsed.ENCRYPTION_KEY;
  if (!access || access.length < 32 || access.startsWith("patra_jwt_") || !refresh || refresh.length < 32 || refresh.startsWith("patra_jwt_") || access === refresh) {
    throw new Error("Production requires distinct ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET values of at least 32 characters");
  }
  if (!encryption || !/^[a-fA-F0-9]{64}$/.test(encryption) || encryption === "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef") throw new Error("Production requires a unique 64-character hex CREDENTIALS_KEY");
  if (!(parsed.MONGODB_URI || parsed.MONGO_URL) || !process.env.REDIS_URL) throw new Error("Production requires explicit MongoDB and Redis URLs");
}


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
