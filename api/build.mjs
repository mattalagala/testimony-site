// Bundles the Functions app into api/.deploy — a self-contained folder that SWA
// managed functions can run as-is (npm workspaces hoist node_modules, so the
// source folder can't be deployed directly).
import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';

const out = new URL('./.deploy/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await build({
  entryPoints: [new URL('./src/index.ts', import.meta.url).pathname],
  outfile: new URL('./index.cjs', out).pathname,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  sourcemap: 'linked',
  minify: false,
  legalComments: 'none',
  // Provided by the Functions host at runtime.
  external: ['@azure/functions-core'],
  logLevel: 'info',
});

await cp(new URL('./host.json', import.meta.url), new URL('./host.json', out));
await writeFile(
  new URL('./package.json', out),
  JSON.stringify({ name: 'testimony-api', private: true, main: 'index.cjs' }, null, 2) + '\n',
);
