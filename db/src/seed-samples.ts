import sql from 'mssql';
import { SAMPLE_TESTIMONIES } from '@testimony/shared/seed';

/**
 * Upserts the clearly-labelled sample testimonies. Refuses to run against prod:
 * real testimonies come only from real people.
 */
export async function seedSamples(
  pool: sql.ConnectionPool,
  environment: string | undefined,
  log: (msg: string) => void = console.log,
): Promise<number> {
  if (!environment || environment === 'prod' || environment === 'production') {
    throw new Error(
      `Refusing to seed sample testimonies into environment "${environment ?? '(unset)'}". ` +
        'Set APP_ENVIRONMENT to dev/local/ci.',
    );
  }

  for (const t of SAMPLE_TESTIMONIES) {
    await pool
      .request()
      .input('slug', sql.NVarChar(160), t.slug)
      .input('title', sql.NVarChar(160), t.title)
      .input('body', sql.NVarChar(sql.MAX), t.body)
      .input('categorySlug', sql.NVarChar(64), t.categorySlug)
      .input('mode', sql.VarChar(10), t.displayNameMode)
      .input('displayName', sql.NVarChar(100), t.displayName)
      .input('daysAgo', sql.Int, t.publishedDaysAgo).query(`
        MERGE dbo.Testimony AS target
        USING (SELECT @slug AS Slug) AS src ON target.Slug = src.Slug
        WHEN MATCHED THEN UPDATE SET
            Title = @title, Body = @body,
            CategoryId = (SELECT Id FROM dbo.Category WHERE Slug = @categorySlug),
            DisplayNameMode = @mode, DisplayName = @displayName,
            Status = 'approved', IsSample = 1, UpdatedAt = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN INSERT
            (Slug, Title, Body, CategoryId, DisplayNameMode, DisplayName, Status, IsSample, PublishedAt)
            VALUES (@slug, @title, @body,
                    (SELECT Id FROM dbo.Category WHERE Slug = @categorySlug),
                    @mode, @displayName, 'approved', 1,
                    DATEADD(DAY, -@daysAgo, SYSUTCDATETIME()));`);
  }
  log(`Seeded ${SAMPLE_TESTIMONIES.length} sample testimonies.`);
  return SAMPLE_TESTIMONIES.length;
}
