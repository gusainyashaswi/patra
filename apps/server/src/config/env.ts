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
  RESEND_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
});

const parsed = schema.parse(process.env);
if (parsed.NODE_ENV === "production") {
  if (process.env.USE_FAKE_TRANSPORT === "true") throw new Error("Fake transport is not allowed in production");
  const access = parsed.ACCESS_TOKEN_SECRET || parsed.JWT_ACCESS_SECRET || parsed.JWT_SECRET;
  const refresh = parsed.REFRESH_TOKEN_SECRET || parsed.JWT_REFRESH_SECRET;
  const encryption = parsed.CREDENTIALS_KEY || parsed.ENCRYPTION_KEY;
  if (!access || access.length < 32 || access.startsWith("patra_jwt_") || !refresh || refresh.length < 32 || refresh.startsWith("patra_jwt_") || access === refresh) {
    throw new Error("Production requires distinct ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET values of at least 32 characters");
  }
  if (!encryption || !/^[a-fA-F0-9]{64}$/.test(encryption) || encryption === "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef") throw new Error("Production requires a unique 64-character hex CREDENTIALS_KEY");
  if (!(parsed.MONGODB_URI || parsed.MONGO_URL) || !process.env.REDIS_URL) throw new Error("Production requires explicit MongoDB and Redis URLs");
}


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
  RESEND_WEBHOOK_SECRET: parsed.RESEND_WEBHOOK_SECRET,
  S3_ENDPOINT: parsed.S3_ENDPOINT,
  S3_REGION: parsed.S3_REGION,
  S3_BUCKET: parsed.S3_BUCKET,
  S3_ACCESS_KEY_ID: parsed.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: parsed.S3_SECRET_ACCESS_KEY,
};
