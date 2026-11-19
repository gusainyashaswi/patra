import type { ReactNode } from "react";

export interface ApiError extends Error {
  status?: number;
}

export interface PageProps {
  children: ReactNode;
}

export interface CampaignCounters {
  totalRecipients: number;
  sentCount: number;
  deliveredCount?: number;
  bouncedCount?: number;
  failedCount?: number;
  [key: string]: number | undefined;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  counters: CampaignCounters;
  [key: string]: unknown;
}

export interface Recipient {
  id: string;
  email: string;
  status: string;
  error?: string;
  requiresReview?: boolean;
}

export interface PaginatedRecipients {
  rows: Recipient[];
  total: number;
}

export interface CampaignEstimate {
  total: number;
  suppressed: number;
  missing: number;
  eligible: number;
}

export interface CampaignForm {
  name: string;
  templateVersionId: string;
  senderIdentityId: string;
  listId: string;
}

export interface SelectOption {
  id: string;
  name?: string;
  subject?: string;
  version?: number;
  displayName?: string;
  fromEmail?: string;
}

export interface CampaignOptions {
  versions: SelectOption[];
  senders: SelectOption[];
  lists: SelectOption[];
}
