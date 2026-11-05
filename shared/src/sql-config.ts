import type { config as SqlConfig } from 'mssql';

/**
 * Builds an mssql connection config from environment variables. Shared by the
 * API (runtime) and the db tooling (migrations/seed) so both connect the same way.
 *
 * Auth precedence:
 *   1. SQL_ACCESS_TOKEN            — Entra token (pipeline: `az account get-access-token`)
 *   2. SQL_USER + SQL_PASSWORD     — SQL auth (API's contained user, local container)
 */
export function buildSqlConfig(env: Record<string, string | undefined> = process.env): SqlConfig {
  const server = required(env, 'SQL_SERVER');
  const database = required(env, 'SQL_DATABASE');
  const trustServerCertificate = env.SQL_TRUST_SERVER_CERTIFICATE === 'true';

  const base: SqlConfig = {
    server,
    database,
    port: env.SQL_PORT ? Number(env.SQL_PORT) : 1433,
    options: { encrypt: true, trustServerCertificate },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
    // Serverless DBs auto-pause; the first connection after a pause can take ~1 min.
    connectionTimeout: Number(env.SQL_CONNECT_TIMEOUT_MS ?? 90_000),
    requestTimeout: 30_000,
  };

  if (env.SQL_ACCESS_TOKEN) {
    return {
      ...base,
      authentication: {
        type: 'azure-active-directory-access-token',
        options: { token: env.SQL_ACCESS_TOKEN },
      },
    };
  }

  return { ...base, user: required(env, 'SQL_USER'), password: required(env, 'SQL_PASSWORD') };
}

function required(env: Record<string, string | undefined>, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}
