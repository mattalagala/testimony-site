import { describe, expect, it } from 'vitest';
import { loadMigrations, splitBatches } from '../src/migrate.js';

describe('splitBatches', () => {
  it('splits on GO lines and drops comment-only batches', () => {
    const script =
      '-- header\nCREATE TABLE a (x int);\nGO\n-- just a comment\nGO\nSELECT 1;\n go \n';
    expect(splitBatches(script)).toEqual(['-- header\nCREATE TABLE a (x int);', 'SELECT 1;']);
  });

  it('does not split on GO inside an identifier or text', () => {
    expect(splitBatches("SELECT 'GO' AS GOAL;")).toHaveLength(1);
  });
});

describe('loadMigrations', () => {
  it('loads numbered migrations in order with checksums', async () => {
    const migrations = await loadMigrations();
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    expect(migrations.map((m) => m.name)).toEqual([...migrations.map((m) => m.name)].sort());
    for (const m of migrations) {
      expect(m.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(m.batches.length).toBeGreaterThan(0);
    }
  });
});
