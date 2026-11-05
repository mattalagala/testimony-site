import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from '@azure/functions';
import { getRepository } from '../data/index.js';
import { createHandlers, type ApiResponse } from '../http/handlers.js';

const handlers = createHandlers(getRepository, {
  // Functions host forwards console.error to App Insights traces.
  error: (message, ...args) => console.error(message, ...args),
});

type Handler = (req: {
  query: URLSearchParams;
  params: Record<string, string | undefined>;
}) => Promise<ApiResponse>;

function adapt(handler: Handler) {
  return async (request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> => {
    const res = await handler({ query: request.query, params: request.params });
    return { status: res.status, jsonBody: res.body, headers: res.headers };
  };
}

// Routes are served under /api (SWA requires the default route prefix).
app.http('listCategories', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'categories',
  handler: adapt(handlers.listCategories),
});

app.http('listTestimonies', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'testimonies',
  handler: adapt(handlers.listTestimonies),
});

app.http('getTestimony', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'testimonies/{slug}',
  handler: adapt(handlers.getTestimony),
});

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: adapt(handlers.health),
});
