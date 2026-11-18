import { z } from "zod";
import { storeImage as storeObject } from "./objectStorage.service.js";

// Use main's storage adapter for both legacy proxy URLs and optional public URLs.
export async function storeImage(organizationId: string, key: string, bytes: Buffer, mime: string) {
  const publicUrl = z.string().url().optional().parse(process.env.S3_PUBLIC_URL || undefined);
  const objectKey = `${organizationId}/${key}`;
  await storeObject(objectKey, bytes, mime);
  return publicUrl ? `${publicUrl.replace(/\/$/, "")}/${objectKey}` : undefined;
}
