/**
 * Public API contract shared by `api` and `web`.
 *
 * These are the ONLY shapes that leave the API. They deliberately carry no
 * email, submitter id, manage token or moderation detail — keep it that way.
 */

export interface CategoryDto {
  slug: string;
  name: string;
}

export interface TestimonySummaryDto {
  slug: string;
  title: string;
  excerpt: string;
  /** Already resolved for display: a first name, a full name, or "Anonymous". */
  displayName: string;
  category: CategoryDto | null;
  publishedAt: string;
}

export interface TestimonyDto extends TestimonySummaryDto {
  /** Plain text; paragraphs separated by blank lines. Never rendered as HTML. */
  body: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  error: string;
}

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
export const ANONYMOUS_DISPLAY_NAME = 'Anonymous';

/** How a submitter chose to be shown publicly. */
export type DisplayNameMode = 'anonymous' | 'first' | 'full';

/** Moderation lifecycle shared by testimonies and prayer requests. */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'needs_care';

export function resolveDisplayName(mode: DisplayNameMode, displayName: string | null): string {
  const trimmed = displayName?.trim();
  if (mode === 'anonymous' || !trimmed) return ANONYMOUS_DISPLAY_NAME;
  return trimmed;
}

/** Build a short plain-text excerpt on a word boundary. */
export function makeExcerpt(body: string, maxLength = 220): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) return flat;
  const cut = flat.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}
