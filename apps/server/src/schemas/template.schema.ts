import { z } from "zod";

const color = z.string().regex(/^#[0-9a-f]{6}$/i);
const align = z.enum(["left", "center", "right"]);
const base = { id: z.string().min(1).max(80), align: align.optional() };
const block = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("text"), text: z.string().max(8000), size: z.number().int().min(10).max(60), weight: z.number().int().min(400).max(900), muted: z.boolean().optional() }),
  z.object({ ...base, type: z.literal("button"), label: z.string().max(200), href: z.string().max(2048), color: color.optional() }),
  z.object({ ...base, type: z.literal("image"), src: z.string().max(2048), alt: z.string().max(500), height: z.number().int().min(40).max(600) }),
  z.object({ ...base, type: z.literal("divider") }),
  z.object({ ...base, type: z.literal("spacer"), height: z.number().int().min(0).max(160) }),
]);

export const draftSchema = z.object({
  name: z.string().max(120),
  subject: z.string().max(300).regex(/^[^\r\n]*$/),
  previewText: z.string().max(500),
  page: z.object({ bg: color, text: color, align, width: z.number().int().min(320).max(800) }),
  blocks: z.array(block).max(75).refine((blocks) => new Set(blocks.map((b) => b.id)).size === blocks.length, "Block IDs must be unique"),
});
export type Draft = z.infer<typeof draftSchema>;
