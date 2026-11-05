import sql from 'mssql';
import { buildSqlConfig } from '@testimony/shared/sql-config';
import { migrate } from './migrate.js';
import { seedSamples } from './seed-samples.js';

/**
 * Creates a fresh, migrated (and optionally seeded) database on the SQL Server
 * pointed to by SQL_* env vars — used by integration tests against a disposable
 * container. Returns a pool for it and a disposer that drops it.
 */
export async function createTestDatabase(opts: { seed?: boolean } = {}): Promise<{
  pool: sql.ConnectionPool;
  config: sql.config;
  dispose: () => Promise<void>;
}> {
  const name = `testimony_it_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const masterConfig = buildSqlConfig({ ...process.env, SQL_DATABASE: 'master' });
  const master = await new sql.ConnectionPool(masterConfig).connect();
  await master.request().batch(`CREATE DATABASE [${name}]`);

  const config = buildSqlConfig({ ...process.env, SQL_DATABASE: name });
  const pool = await new sql.ConnectionPool(config).connect();
  await migrate(pool, () => undefined);
  if (opts.seed) await seedSamples(pool, 'ci', () => undefined);

  return {
    pool,
    config,
    dispose: async () => {
      await pool.close();
      await master
        .request()
        .batch(
          `ALTER DATABASE [${name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${name}];`,
        );
      await master.close();
    },
  };
}
