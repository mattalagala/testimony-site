import sql from 'mssql';
import { buildSqlConfig } from '@testimony/shared/sql-config';
import { migrate } from './migrate.js';
import { seedSamples } from './seed-samples.js';
import { ensureAppUser } from './ensure-app-user.js';

const command = process.argv[2];

async function main(): Promise<void> {
  const pool = await new sql.ConnectionPool(buildSqlConfig()).connect();
  try {
    switch (command) {
      case 'migrate':
        await migrate(pool);
        break;
      case 'seed-samples':
        await seedSamples(pool, process.env.APP_ENVIRONMENT);
        break;
      case 'ensure-app-user':
        await ensureAppUser(
          pool,
          process.env.APP_DB_USER ?? 'api_app',
          process.env.APP_DB_PASSWORD ?? '',
        );
        break;
      default:
        throw new Error(
          `Unknown command "${command}". Use migrate | seed-samples | ensure-app-user`,
        );
    }
  } finally {
    await pool.close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
