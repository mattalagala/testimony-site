/**
 * Lightweight local API server for `npm run dev` and the CI e2e stack.
 * Serves the same handlers as the Functions app, backed by in-memory sample data,
 * so you can work on the site without Azure, Core Tools or a database.
 * For the real runtime use `swa start` / `func start` instead.
 */
import { createServer } from 'node:http';
import { MemoryTestimonyRepository } from '../data/memory-repository.js';
import { createHandlers, type ApiRequest, type ApiResponse } from '../http/handlers.js';

const repo = MemoryTestimonyRepository.withSamples();
const handlers = createHandlers(() => repo, console);

const routes: Array<{
  pattern: RegExp;
  keys: string[];
  handler: (req: ApiRequest) => Promise<ApiResponse>;
}> = [
  { pattern: /^\/api\/categories$/, keys: [], handler: handlers.listCategories },
  { pattern: /^\/api\/testimonies$/, keys: [], handler: handlers.listTestimonies },
  { pattern: /^\/api\/testimonies\/([^/]+)$/, keys: ['slug'], handler: handlers.getTestimony },
  { pattern: /^\/api\/health$/, keys: [], handler: handlers.health },
];

const port = Number(process.env.API_PORT ?? 7071);

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const route = req.method === 'GET' ? routes.find((r) => r.pattern.test(url.pathname)) : undefined;
  if (!route) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  const match = url.pathname.match(route.pattern)!;
  const params = Object.fromEntries(
    route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1] ?? '')]),
  );
  const result = await route.handler({ query: url.searchParams, params });
  res.writeHead(result.status, { 'Content-Type': 'application/json', ...result.headers });
  res.end(JSON.stringify(result.body));
}).listen(port, () => {
  console.log(`Local API (sample data) on http://localhost:${port}/api`);
});
