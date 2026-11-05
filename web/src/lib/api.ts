import type { CategoryDto, Paged, TestimonyDto, TestimonySummaryDto } from '@testimony/shared';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiRequestError(res.status, message);
  }
  return (await res.json()) as T;
}

export const api = {
  categories: (signal?: AbortSignal) => getJson<CategoryDto[]>('/api/categories', signal),

  testimonies: (opts: { category?: string; page?: number }, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    if (opts.page && opts.page > 1) params.set('page', String(opts.page));
    const qs = params.toString();
    return getJson<Paged<TestimonySummaryDto>>(`/api/testimonies${qs ? `?${qs}` : ''}`, signal);
  },

  testimony: (slug: string, signal?: AbortSignal) =>
    getJson<TestimonyDto>(`/api/testimonies/${encodeURIComponent(slug)}`, signal),
};
