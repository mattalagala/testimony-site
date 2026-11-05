import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { TestimonySummaryDto } from '@testimony/shared';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { SITE_TAGLINE } from '../lib/site';
import { CategoryFilter } from '../components/CategoryFilter';
import { StoryListItem } from '../components/StoryListItem';
import { ErrorMessage, Loading } from '../components/Status';
import { usePageTitle } from '../lib/usePageTitle';

interface FeedState {
  key: string;
  items: TestimonySummaryDto[];
  page: number;
  total: number;
  status: 'loading' | 'ready' | 'loading-more' | 'error';
}

export function FeedPage() {
  const [params] = useSearchParams();
  const category = params.get('category') ?? undefined;
  const key = category ?? '';
  const [attempt, setAttempt] = useState(0);
  const [feed, setFeed] = useState<FeedState>({
    key,
    items: [],
    page: 0,
    total: 0,
    status: 'loading',
  });
  const categories = useApi('categories', (signal) => api.categories(signal));

  const activeCategory =
    categories.status === 'success' ? categories.data.find((c) => c.slug === category) : undefined;
  usePageTitle(activeCategory ? `${activeCategory.name} stories` : undefined);

  useEffect(() => {
    const controller = new AbortController();
    api.testimonies({ category }, controller.signal).then(
      (res) => setFeed({ key, items: res.items, page: 1, total: res.total, status: 'ready' }),
      () => !controller.signal.aborted && setFeed((f) => ({ ...f, key, status: 'error' })),
    );
    return () => controller.abort();
  }, [key, category, attempt]);

  async function loadMore() {
    setFeed((f) => ({ ...f, status: 'loading-more' }));
    try {
      const res = await api.testimonies({ category, page: feed.page + 1 });
      setFeed((f) =>
        f.key === key
          ? {
              ...f,
              items: [...f.items, ...res.items],
              page: f.page + 1,
              total: res.total,
              status: 'ready',
            }
          : f,
      );
    } catch {
      setFeed((f) => ({ ...f, status: 'error' }));
    }
  }

  function retry() {
    setFeed((f) => ({ ...f, status: 'loading' }));
    setAttempt((n) => n + 1);
  }

  // A category change shows "loading" until its first page arrives.
  const current = feed.key === key ? feed : { ...feed, items: [], status: 'loading' as const };
  const hasMore = current.items.length < current.total;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="max-w-3xl pb-10 pt-14 sm:pt-20">
        <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-night sm:text-6xl">
          {SITE_TAGLINE}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">
          Ordinary people, in their own words, telling what happened when Jesus stepped into their
          lives.
        </p>
      </section>

      {categories.status === 'success' && (
        <CategoryFilter categories={categories.data} active={category} />
      )}

      <section aria-label="Stories" className="max-w-3xl pb-20">
        {current.status === 'loading' && <Loading label="Loading stories…" />}

        {current.status === 'error' && current.items.length === 0 && (
          <ErrorMessage onRetry={retry}>
            Stories couldn’t be loaded. Check your connection and try again.
          </ErrorMessage>
        )}

        {current.status !== 'loading' &&
          current.status !== 'error' &&
          current.items.length === 0 && (
            <p className="py-16 text-slate">
              No stories in this topic yet. Browse all stories, or check back soon.
            </p>
          )}

        {current.items.length > 0 && (
          <div className="divide-y divide-line">
            {current.items.map((story) => (
              <StoryListItem key={story.slug} story={story} />
            ))}
          </div>
        )}

        {current.status === 'error' && current.items.length > 0 && (
          <ErrorMessage onRetry={loadMore}>More stories couldn’t be loaded.</ErrorMessage>
        )}

        {hasMore && current.status !== 'error' && (
          <button
            type="button"
            onClick={loadMore}
            disabled={current.status === 'loading-more'}
            className="mt-6 rounded-full border border-night px-6 py-2.5 font-medium text-night hover:bg-night hover:text-white disabled:opacity-60"
          >
            {current.status === 'loading-more' ? 'Loading…' : 'Show more stories'}
          </button>
        )}
      </section>
    </div>
  );
}
