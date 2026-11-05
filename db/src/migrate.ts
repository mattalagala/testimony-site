import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sql from 'mssql';

export const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../migrations',
);

export interface Migration {
  name: string;
  checksum: string;
  batches: string[];
}

/** Split a script on `GO` lines, the way sqlcmd/SSMS do. */
export function splitBatches(script: string): string[] {
  return script
    .split(/^\s*GO\s*;?\s*$/im)
    .map((b) => b.trim())
    .filter((b) => b.replace(/^\s*--.*$/gm, '').trim().length > 0);
}

export async function loadMigrations(dir = MIGRATIONS_DIR): Promise<Migration[]> {
  const files = (await readdir(dir)).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
  return Promise.all(
    files.map(async (name) => {
      const text = (await readFile(path.join(dir, name), 'utf8')).replace(/\r\n/g, '\n');
      return {
        name,
        checksum: createHash('sha256').update(text).digest('hex'),
        batches: splitBatches(text),
      };
    }),
  );
}

const ENSURE_HISTORY_TABLE = `
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
CREATE TABLE dbo.SchemaMigrations (
    Name       NVARCHAR(200) NOT NULL CONSTRAINT PK_SchemaMigrations PRIMARY KEY,
    Checksum   CHAR(64)      NOT NULL,
    AppliedAt  DATETIME2(0)  NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME()
);`;

/**
 * Applies pending migrations in order, each in its own transaction.
 * Fails loudly if an already-applied file was edited: write a new migration instead.
 */
export async function migrate(
  pool: sql.ConnectionPool,
  log: (msg: string) => void = console.log,
): Promise<string[]> {
  await pool.request().batch(ENSURE_HISTORY_TABLE);

  const applied = new Map<string, string>(
    (
      await pool
        .request()
        .query<{ Name: string; Checksum: string }>(
          'SELECT Name, Checksum FROM dbo.SchemaMigrations',
        )
    ).recordset.map((r) => [r.Name, r.Checksum]),
  );

  const migrations = await loadMigrations();
  for (const m of migrations) {
    const previous = applied.get(m.name);
    if (previous && previous !== m.checksum) {
      throw new Error(
        `Migration ${m.name} was modified after being applied. Add a new migration instead.`,
      );
    }
  }

  const pending = migrations.filter((m) => !applied.has(m.name));
  if (pending.length === 0) {
    log('Database is up to date.');
    return [];
  }

  for (const m of pending) {
    log(`Applying ${m.name}…`);
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      for (const batch of m.batches) {
        await new sql.Request(tx).batch(batch);
      }
      await new sql.Request(tx)
        .input('name', sql.NVarChar(200), m.name)
        .input('checksum', sql.Char(64), m.checksum)
        .query('INSERT INTO dbo.SchemaMigrations (Name, Checksum) VALUES (@name, @checksum)');
      await tx.commit();
    } catch (err) {
      await tx.rollback().catch(() => undefined);
      throw new Error(`Migration ${m.name} failed: ${(err as Error).message}`, { cause: err });
    }
  }
  log(`Applied ${pending.length} migration(s).`);
  return pending.map((m) => m.name);
}
