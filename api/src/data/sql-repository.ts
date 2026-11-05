import sql from 'mssql';
import {
  makeExcerpt,
  resolveDisplayName,
  type CategoryDto,
  type DisplayNameMode,
  type Paged,
  type TestimonyDto,
  type TestimonySummaryDto,
} from '@testimony/shared';
import type { ListTestimoniesQuery, TestimonyRepository } from './repository.js';

interface TestimonyRow {
  Slug: string;
  Title: string;
  Body: string;
  DisplayNameMode: DisplayNameMode;
  DisplayName: string | null;
  PublishedAt: Date;
  CategorySlug: string | null;
  CategoryName: string | null;
}

// Every public query goes through this filter. Keep it in one place.
const PUBLIC_FILTER = `t.Status = 'approved' AND t.PublishedAt IS NOT NULL AND t.PublishedAt <= SYSUTCDATETIME()`;

const SELECT_COLUMNS = `
  t.Slug, t.Title, t.DisplayNameMode, t.DisplayName, t.PublishedAt,
  c.Slug AS CategorySlug, c.Name AS CategoryName`;

export class SqlTestimonyRepository implements TestimonyRepository {
  constructor(private readonly getPool: () => Promise<sql.ConnectionPool>) {}

  async listCategories(): Promise<CategoryDto[]> {
    const pool = await this.getPool();
    const { recordset } = await pool
      .request()
      .query<{ Slug: string; Name: string }>(
        'SELECT Slug, Name FROM dbo.Category ORDER BY SortOrder, Name',
      );
    return recordset.map((r) => ({ slug: r.Slug, name: r.Name }));
  }

  async listTestimonies(q: ListTestimoniesQuery): Promise<Paged<TestimonySummaryDto>> {
    const pool = await this.getPool();
    const categoryFilter = q.categorySlug ? 'AND c.Slug = @category' : '';
    const request = pool
      .request()
      .input('offset', sql.Int, (q.page - 1) * q.pageSize)
      .input('pageSize', sql.Int, q.pageSize);
    if (q.categorySlug) request.input('category', sql.NVarChar(64), q.categorySlug);

    // Excerpt only needs the start of the body; avoid pulling NVARCHAR(MAX) for a list.
    const result = await request.query<TestimonyRow & { Total: number }>(`
      SELECT ${SELECT_COLUMNS}, LEFT(t.Body, 600) AS Body, COUNT(*) OVER () AS Total
      FROM dbo.Testimony t
      LEFT JOIN dbo.Category c ON c.Id = t.CategoryId
      WHERE ${PUBLIC_FILTER} ${categoryFilter}
      ORDER BY t.PublishedAt DESC, t.Slug
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`);

    let total = result.recordset[0]?.Total ?? 0;
    if (result.recordset.length === 0 && q.page > 1) {
      // Past the last page: still report the real total.
      const count = pool.request();
      if (q.categorySlug) count.input('category', sql.NVarChar(64), q.categorySlug);
      total =
        (
          await count.query<{ Total: number }>(`
            SELECT COUNT(*) AS Total FROM dbo.Testimony t
            LEFT JOIN dbo.Category c ON c.Id = t.CategoryId
            WHERE ${PUBLIC_FILTER} ${categoryFilter}`)
        ).recordset[0]?.Total ?? 0;
    }

    return {
      items: result.recordset.map(toSummary),
      page: q.page,
      pageSize: q.pageSize,
      total,
    };
  }

  async getTestimonyBySlug(slug: string): Promise<TestimonyDto | null> {
    const pool = await this.getPool();
    const { recordset } = await pool.request().input('slug', sql.NVarChar(160), slug)
      .query<TestimonyRow>(`
        SELECT ${SELECT_COLUMNS}, t.Body
        FROM dbo.Testimony t
        LEFT JOIN dbo.Category c ON c.Id = t.CategoryId
        WHERE t.Slug = @slug AND ${PUBLIC_FILTER}`);
    const row = recordset[0];
    return row ? { ...toSummary(row), body: row.Body } : null;
  }

  async ping(): Promise<void> {
    const pool = await this.getPool();
    await pool.request().query('SELECT 1 AS ok');
  }
}

function toSummary(row: TestimonyRow): TestimonySummaryDto {
  return {
    slug: row.Slug,
    title: row.Title,
    excerpt: makeExcerpt(row.Body),
    displayName: resolveDisplayName(row.DisplayNameMode, row.DisplayName),
    category:
      row.CategorySlug && row.CategoryName
        ? { slug: row.CategorySlug, name: row.CategoryName }
        : null,
    publishedAt: row.PublishedAt.toISOString(),
  };
}
