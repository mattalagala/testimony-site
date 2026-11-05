import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CATEGORIES, SAMPLE_TESTIMONIES } from '@testimony/shared/seed';
import { createTestDatabase } from '../src/testing.js';
import { migrate } from '../src/migrate.js';
import { seedSamples } from '../src/seed-samples.js';

let db: Awaited<ReturnType<typeof createTestDatabase>>;

beforeAll(async () => {
  db = await createTestDatabase();
});
afterAll(async () => {
  await db?.dispose();
});

describe('migrations', () => {
  it('are idempotent', async () => {
    expect(await migrate(db.pool, () => undefined)).toEqual([]);
  });

  it('insert the same categories the app knows about', async () => {
    const rows = (
      await db.pool
        .request()
        .query<{ Slug: string; Name: string; SortOrder: number }>(
          'SELECT Slug, Name, SortOrder FROM dbo.Category ORDER BY SortOrder',
        )
    ).recordset;
    expect(rows.map((r) => ({ slug: r.Slug, name: r.Name, sortOrder: r.SortOrder }))).toEqual([
      ...CATEGORIES,
    ]);
  });

  it('enforces that approved testimonies have a publish date', async () => {
    await expect(
      db.pool.request().query(`
        INSERT INTO dbo.Testimony (Slug, Title, Body, DisplayNameMode, Status)
        VALUES (N'no-date', N'x', N'x', 'anonymous', 'approved')`),
    ).rejects.toThrow(/CK_Testimony_PublishedWhenApproved/);
  });
});

describe('seedSamples', () => {
  it('refuses to run in prod', async () => {
    await expect(seedSamples(db.pool, 'prod', () => undefined)).rejects.toThrow(/Refusing/);
    await expect(seedSamples(db.pool, undefined, () => undefined)).rejects.toThrow(/Refusing/);
  });

  it('is idempotent and marks rows as samples', async () => {
    await seedSamples(db.pool, 'ci', () => undefined);
    await seedSamples(db.pool, 'ci', () => undefined);
    const { recordset } = await db.pool
      .request()
      .query<{ n: number; samples: number }>(
        'SELECT COUNT(*) AS n, SUM(CAST(IsSample AS INT)) AS samples FROM dbo.Testimony',
      );
    expect(recordset[0]).toEqual({
      n: SAMPLE_TESTIMONIES.length,
      samples: SAMPLE_TESTIMONIES.length,
    });
  });
});
