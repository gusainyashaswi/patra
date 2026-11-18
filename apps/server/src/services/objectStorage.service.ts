import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new ApiError(503, "Image storage is not configured");
  }
  client ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
  return client;
}

export async function storeImage(objectKey: string, bytes: Buffer, mime: string): Promise<void> {
  try {
    await getClient().send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey, Body: bytes, ContentType: mime }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Could not store the image. Please retry.");
  }
}

export async function readImage(objectKey: string): Promise<Uint8Array> {
  try {
    const result = await getClient().send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }));
    if (!result.Body) throw new ApiError(404, "Image not found");
    return result.Body.transformToByteArray();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const statusCode = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (statusCode === 404) throw new ApiError(404, "Image not found");
    throw new ApiError(502, "Could not retrieve the image.");
  }
}
