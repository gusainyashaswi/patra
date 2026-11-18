import { storeImage } from "../services/storage.service.js";
import express, { Router } from "express";
import { randomUUID } from "node:crypto";
import { Schema, model } from "mongoose";
import { z } from "zod";
import { ensureDbConnected } from "../middleware/ensureDb.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ImageAsset = model("ImageAsset", new Schema({
  key: { type: String, required: true, unique: true },
  organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
  mime: { type: String, required: true },
  bytes: { type: Buffer, required: true },
}, { timestamps: true }));

export const uploadRouter = Router({ mergeParams: true });
export const publicImageRouter = Router();
uploadRouter.post("/", requirePermission("manage_templates"),
  express.raw({ type: ["image/png", "image/jpeg"], limit: "2mb", inflate: false }),
  asyncHandler(async (req, res) => {
    const bytes: unknown = req.body;
    if (!Buffer.isBuffer(bytes) || bytes.length < 12) throw new ApiError(400, "Upload a PNG or JPEG image.");
    const png = bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
    const jpeg = bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex")) && bytes.subarray(-2).equals(Buffer.from("ffd9", "hex"));
    const mime = png ? "image/png" : jpeg ? "image/jpeg" : undefined;
    if (!mime || !req.is(mime)) throw new ApiError(400, "The file contents must match its PNG or JPEG type.");
    const key = randomUUID();
    const url = await storeImage(req.user!.organizationId!, key, bytes, mime);
    res.status(201).json({ data: { path: url, url } });
  }),
);

publicImageRouter.get("/:key", ensureDbConnected, asyncHandler(async (req, res) => {
  const key = z.string().uuid().safeParse(req.params.key);
  if (!key.success) throw new ApiError(404, "Image not found");
  const image = await ImageAsset.findOne({ key: key.data });
  if (!image) throw new ApiError(404, "Image not found");
  res.set({
    "Content-Type": image.mime,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cache-Control": "public, max-age=31536000, immutable",
  }).send(image.bytes);
}));
