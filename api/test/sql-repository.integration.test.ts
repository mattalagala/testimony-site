import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SAMPLE_TESTIMONIES } from '@testimony/shared/seed';
import { createTestDatabase } from '@testimony/db/testing';
import { SqlTestimonyRepository } from '../src/data/sql-repository.js';

let db: Awaited<ReturnType<typeof createTestDatabase>>;
let repo: SqlTestimonyRepository;

beforeAll(async () => {
  db = await createTestDatabase({ seed: true });
  repo = new SqlTestimonyRepository(async () => db.pool);
  // Rows that must never be visible publicly.
  await db.pool.request().query(`
    INSERT INTO dbo.Testimony (Slug, Title, Body, DisplayNameMode, Status, PublishedAt) VALUES
      (N'pending-one',  N'Pending',  N'x', 'anonymous', 'pending',    NULL),
      (N'rejected-one', N'Rejected', N'x', 'anonymous', 'rejected',   SYSUTCDATETIME()),
      (N'care-one',     N'Care',     N'x', 'anonymous', 'needs_care', SYSUTCDATETIME()),
      (N'future-one',   N'Future',   N'x', 'anonymous', 'approved',   DATEADD(DAY, 3, SYSUTCDATETIME()));`);
});
afterAll(async () => {
  await db?.dispose();
});

describe('SqlTestimonyRepository', () => {
  it('lists only published samples, newest first', async () => {
    const page = await repo.listTestimonies({ page: 1, pageSize: 50 });
    expect(page.total).toBe(SAMPLE_TESTIMONIES.length);
    const expected = [...SAMPLE_TESTIMONIES]
      .sort((a, b) => a.publishedDaysAgo - b.publishedDaysAgo)
      .map((t) => t.slug);
    expect(page.items.map((t) => t.slug)).toEqual(expected);
  });

  it('filters by category and pages', async () => {
    const page = await repo.listTestimonies({ categorySlug: 'salvation', page: 1, pageSize: 10 });
    expect(page.items.every((t) => t.category?.slug === 'salvation')).toBe(true);

    const p2 = await repo.listTestimonies({ page: 2, pageSize: 3 });
    expect(p2.items).toHaveLength(3);
    const beyond = await repo.listTestimonies({ page: 99, pageSize: 3 });
    expect(beyond.items).toHaveLength(0);
    expect(beyond.total).toBe(SAMPLE_TESTIMONIES.length);
  });

  it('resolves anonymous display names', async () => {
    const anon = SAMPLE_TESTIMONIES.find((t) => t.displayNameMode === 'anonymous')!;
    expect((await repo.getTestimonyBySlug(anon.slug))?.displayName).toBe('Anonymous');
  });

  it('returns full body for a published testimony and null for hidden ones', async () => {
    const sample = SAMPLE_TESTIMONIES[0]!;
    expect((await repo.getTestimonyBySlug(sample.slug))?.body).toBe(sample.body);
    for (const slug of ['pending-one', 'rejected-one', 'care-one', 'future-one']) {
      expect(await repo.getTestimonyBySlug(slug)).toBeNull();
    }
  });

  it('lists categories', async () => {
    expect((await repo.listCategories()).length).toBe(7);
  });
});
