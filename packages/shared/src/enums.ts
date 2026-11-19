// Shared enums and type aliases used across the monorepo.
// Imported directly by path; no package resolution needed.

export const TRANSPORT_TYPES = ["RESEND", "SMTP", "SES"] as const;
export const TRANSPORT_STATUSES = ["UNVERIFIED", "VERIFIED", "FAILED"] as const;
export const TEMPLATE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "QUEUED",
  "SENDING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;
export const CAMPAIGN_PRIORITIES = ["NORMAL", "URGENT"] as const;
export const RECIPIENT_STATUSES = [
  "QUEUED",
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "FAILED",
  "OPENED",
  "CLICKED",
  "COMPLAINED",
  "SKIPPED",
] as const;
export const SUPPRESSION_REASONS = ["UNSUBSCRIBED", "HARD_BOUNCE", "COMPLAINT", "MANUAL"] as const;

export type TransportType = (typeof TRANSPORT_TYPES)[number];
export type TransportStatus = (typeof TRANSPORT_STATUSES)[number];
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type CampaignPriority = (typeof CAMPAIGN_PRIORITIES)[number];
export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];
