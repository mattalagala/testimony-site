import { describe, expect, it, vi } from 'vitest';
import { ANONYMOUS_DISPLAY_NAME, type Paged, type TestimonySummaryDto } from '@testimony/shared';
import { createHandlers } from '../src/http/handlers.js';
import { MemoryTestimonyRepository, type MemoryTestimony } from '../src/data/memory-repository.js';
import type { TestimonyRepository } from '../src/data/repository.js';

const NOW = new Date('2026-11-01T12:00:00Z');
const day = 86_400_000;

function testimony(overrides: Partial<MemoryTestimony>): MemoryTestimony {
  return {
    slug: 'a',
    title: 'A',
    body: 'Body text',
    categorySlug: 'healing',
    displayNameMode: 'first',
    displayName: 'Ann',
    status: 'approved',
    publishedAt: new Date(NOW.getTime() - day),
    ...overrides,
  };
}

function setup(testimonies: MemoryTestimony[]) {
  const repo = new MemoryTestimonyRepository(
    [
      { slug: 'healing', name: 'Healing', sortOrder: 2 },
      { slug: 'salvation', name: 'Salvation', sortOrder: 1 },
    ],
    testimonies,
    () => NOW,
  );
  const log = { error: vi.fn() };
  return { handlers: createHandlers(() => repo, log), log };
}

const req = (query = '', params: Record<string, string> = {}) => ({
  query: new URLSearchParams(query),
  params,
});

describe('listTestimonies', () => {
  it('returns only approved, already-published testimonies, newest first', async () => {
    const { handlers } = setup([
      testimony({ slug: 'old', publishedAt: new Date(NOW.getTime() - 5 * day) }),
      testimony({ slug: 'new', publishedAt: new Date(NOW.getTime() - day) }),
      testimony({ slug: 'pending', status: 'pending' }),
      testimony({ slug: 'rejected', status: 'rejected' }),
      testimony({ slug: 'care', status: 'needs_care' }),
      testimony({ slug: 'future', publishedAt: new Date(NOW.getTime() + day) }),
    ]);
    const res = await handlers.listTestimonies(req());
    expect(res.status).toBe(200);
    const body = res.body as Paged<TestimonySummaryDto>;
    expect(body.items.map((t) => t.slug)).toEqual(['new', 'old']);
    expect(body.total).toBe(2);
  });

  it('filters by category', async () => {
    const { handlers } = setup([
      testimony({ slug: 'h' }),
      testimony({ slug: 's', categorySlug: 'salvation' }),
    ]);
    const body = (await handlers.listTestimonies(req('category=salvation')))
      .body as Paged<TestimonySummaryDto>;
    expect(body.items.map((t) => t.slug)).toEqual(['s']);
    expect(body.items[0]?.category).toEqual({ slug: 'salvation', name: 'Salvation' });
  });

  it('pages results', async () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      testimony({ slug: `t${i}`, publishedAt: new Date(NOW.getTime() - (i + 1) * day) }),
    );
    const { handlers } = setup(items);
    const body = (await handlers.listTestimonies(req('page=2&pageSize=2')))
      .body as Paged<TestimonySummaryDto>;
    expect(body).toMatchObject({ page: 2, pageSize: 2, total: 5 });
    expect(body.items.map((t) => t.slug)).toEqual(['t2', 't3']);
  });

  it.each([
    ['category=Bad Slug', /category/i],
    ['category=%27%3B--', /category/i],
    ['page=0', /page/i],
    ['page=-1', /page/i],
    ['page=abc', /page/i],
    ['pageSize=51', /pageSize/],
    ['pageSize=0', /pageSize/],
  ])('rejects invalid query %s', async (query, message) => {
    const { handlers } = setup([]);
    const res = await handlers.listTestimonies(req(query));
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toMatch(message);
  });

  it('never exposes anything identifying beyond the chosen display name', async () => {
    const { handlers } = setup([
      testimony({ slug: 'anon', displayNameMode: 'anonymous', displayName: 'Should Not Show' }),
    ]);
    const body = (await handlers.listTestimonies(req())).body as Paged<TestimonySummaryDto>;
    const item = body.items[0]!;
    expect(item.displayName).toBe(ANONYMOUS_DISPLAY_NAME);
    expect(JSON.stringify(body)).not.toContain('Should Not Show');
    expect(Object.keys(item).sort()).toEqual(
      ['category', 'displayName', 'excerpt', 'publishedAt', 'slug', 'title'].sort(),
    );
  });
});

describe('getTestimony', () => {
  it('returns the full testimony', async () => {
    const { handlers } = setup([testimony({ slug: 'hello', body: 'Full story' })]);
    const res = await handlers.getTestimony(req('', { slug: 'hello' }));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ slug: 'hello', body: 'Full story', displayName: 'Ann' });
  });

  it('404s for unpublished testimonies', async () => {
    const { handlers } = setup([testimony({ slug: 'hidden', status: 'pending' })]);
    expect((await handlers.getTestimony(req('', { slug: 'hidden' }))).status).toBe(404);
  });

  it('400s for malformed slugs', async () => {
    const { handlers } = setup([]);
    expect((await handlers.getTestimony(req('', { slug: '../etc' }))).status).toBe(400);
  });
});

describe('listCategories', () => {
  it('returns categories in sort order', async () => {
    const { handlers } = setup([]);
    expect((await handlers.listCategories(req())).body).toEqual([
      { slug: 'salvation', name: 'Salvation' },
      { slug: 'healing', name: 'Healing' },
    ]);
  });
});

describe('error handling', () => {
  const failing: TestimonyRepository = {
    listCategories: () => Promise.reject(new Error('Login failed for user api_app')),
    listTestimonies: () => Promise.reject(new Error('boom')),
    getTestimonyBySlug: () => Promise.reject(new Error('boom')),
    ping: () => Promise.reject(new Error('timeout')),
  };

  it('returns a generic 500 and logs the real error', async () => {
    const log = { error: vi.fn() };
    const res = await createHandlers(() => failing, log).listCategories(req());
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('api_app');
    expect(log.error).toHaveBeenCalled();
  });

  it('health reports 503 when the database is unreachable', async () => {
    const res = await createHandlers(() => failing, { error: vi.fn() }).health(req());
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'degraded', database: 'unreachable' });
  });
});
