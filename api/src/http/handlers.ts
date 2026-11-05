import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type ApiError } from '@testimony/shared';
import type { TestimonyRepository } from '../data/repository.js';

/** Minimal, framework-agnostic request/response so handlers run in Functions and the local server. */
export interface ApiRequest {
  query: URLSearchParams;
  params: Record<string, string | undefined>;
}

export interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface Logger {
  error(message: string, ...args: unknown[]): void;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Public, read-only data: short shared cache keeps the serverless DB asleep more often.
const PUBLIC_CACHE = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' };
const NO_STORE = { 'Cache-Control': 'no-store' };

const bad = (error: string): ApiResponse => ({
  status: 400,
  body: { error } satisfies ApiError,
  headers: NO_STORE,
});

function parsePositiveInt(raw: string | null, fallback: number): number | null {
  if (raw === null || raw === '') return fallback;
  if (!/^\d{1,6}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 ? n : null;
}

async function guarded(log: Logger, fn: () => Promise<ApiResponse>): Promise<ApiResponse> {
  try {
    return await fn();
  } catch (err) {
    // Log details server-side only; never echo internals to the client.
    log.error('Unhandled API error', err);
    return {
      status: 500,
      body: { error: 'Something went wrong. Please try again.' } satisfies ApiError,
      headers: NO_STORE,
    };
  }
}

export function createHandlers(repo: () => TestimonyRepository, log: Logger) {
  return {
    listCategories: (_req: ApiRequest) =>
      guarded(log, async () => ({
        status: 200,
        body: await repo().listCategories(),
        headers: PUBLIC_CACHE,
      })),

    listTestimonies: (req: ApiRequest) =>
      guarded(log, async () => {
        const category = req.query.get('category') || undefined;
        if (category !== undefined && (!SLUG.test(category) || category.length > 64)) {
          return bad('Invalid category.');
        }
        const page = parsePositiveInt(req.query.get('page'), 1);
        const pageSize = parsePositiveInt(req.query.get('pageSize'), DEFAULT_PAGE_SIZE);
        if (page === null) return bad('Invalid page.');
        if (pageSize === null || pageSize > MAX_PAGE_SIZE) {
          return bad(`pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
        }
        return {
          status: 200,
          body: await repo().listTestimonies({ categorySlug: category, page, pageSize }),
          headers: PUBLIC_CACHE,
        };
      }),

    getTestimony: (req: ApiRequest) =>
      guarded(log, async () => {
        const slug = req.params.slug ?? '';
        if (!SLUG.test(slug) || slug.length > 160) return bad('Invalid testimony.');
        const testimony = await repo().getTestimonyBySlug(slug);
        if (!testimony) {
          return { status: 404, body: { error: 'Testimony not found.' }, headers: PUBLIC_CACHE };
        }
        return { status: 200, body: testimony, headers: PUBLIC_CACHE };
      }),

    health: (_req: ApiRequest) =>
      guarded(log, async () => {
        try {
          await repo().ping();
          return { status: 200, body: { status: 'ok', database: 'ok' }, headers: NO_STORE };
        } catch (err) {
          log.error('Health check: database unreachable', err);
          return {
            status: 503,
            body: { status: 'degraded', database: 'unreachable' },
            headers: NO_STORE,
          };
        }
      }),
  };
}

export type Handlers = ReturnType<typeof createHandlers>;
