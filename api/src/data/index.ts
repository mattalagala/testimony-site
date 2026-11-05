import sql from 'mssql';
import { buildSqlConfig } from '@testimony/shared/sql-config';
import { MemoryTestimonyRepository } from './memory-repository.js';
import { SqlTestimonyRepository } from './sql-repository.js';
import type { TestimonyRepository } from './repository.js';

let repository: TestimonyRepository | undefined;
let poolPromise: Promise<sql.ConnectionPool> | undefined;

function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(buildSqlConfig()).connect().catch((err: unknown) => {
      // Don't cache a failed connection (e.g. serverless DB resuming); retry next call.
      poolPromise = undefined;
      throw err;
    });
  }
  return poolPromise;
}

/**
 * DATA_SOURCE=memory → sample data in memory (local dev, CI e2e).
 * Anything else (default) → Azure SQL via SQL_* settings.
 */
export function getRepository(): TestimonyRepository {
  if (!repository) {
    repository =
      process.env.DATA_SOURCE === 'memory'
        ? MemoryTestimonyRepository.withSamples()
        : new SqlTestimonyRepository(getPool);
  }
  return repository;
}

/** Test hook. */
export function setRepository(repo: TestimonyRepository | undefined): void {
  repository = repo;
}
