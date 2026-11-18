import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { ApiError } from "../utils/apiError.js";

function configuration() {
  const parsed = z.object({ S3_ENDPOINT: z.string().url(), S3_REGION: z.string().default("us-east-1"), S3_BUCKET: z.string().min(1), S3_ACCESS_KEY: z.string().min(1), S3_SECRET_KEY: z.string().min(1), S3_PUBLIC_URL: z.string().url() }).safeParse(process.env);
  if (!parsed.success) throw new ApiError(503, "Configure S3 object storage before uploading images");
  return parsed.data;
}
export async function storeImage(organizationId: string, key: string, bytes: Buffer, mime: string) {
  const config = configuration();
  const client = new S3Client({ endpoint: config.S3_ENDPOINT, region: config.S3_REGION, forcePathStyle: true, credentials: { accessKeyId: config.S3_ACCESS_KEY, secretAccessKey: config.S3_SECRET_KEY }, maxAttempts: 2 });
  const objectKey = `${organizationId}/${key}`;
  try {
    await client.send(new PutObjectCommand({ Bucket: config.S3_BUCKET, Key: objectKey, Body: bytes, ContentType: mime, CacheControl: "public, max-age=31536000, immutable" }), { abortSignal: AbortSignal.timeout(15000) });
    return `${config.S3_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`;
  } catch { throw new ApiError(502, "Image storage is unavailable. Please retry the upload."); }
  finally { client.destroy(); }
}
