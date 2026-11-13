import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

const METHOD = "aes-256-gcm";
const SECRET = Buffer.from(env.CREDENTIALS_KEY, "hex");

export function encrypt(text: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv(METHOD, SECRET, nonce);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [nonce, tag, body].map((p) => p.toString("base64")).join(".");
}

export function decrypt(value: string): string {
  const [nonce, tag, body] = value.split(".").map((p) => Buffer.from(p, "base64"));
  if (!nonce || !tag || !body) throw new Error("Bad encrypted value");
  const decipher = createDecipheriv(METHOD, SECRET, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}
