import { Link, useParams } from 'react-router';
import { api, ApiRequestError } from '../lib/api';
import { useApi } from '../lib/useApi';
import { toParagraphs } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { StoryByline } from '../components/StoryListItem';
import { NextStep } from '../components/NextStep';
import { ErrorMessage, Loading } from '../components/Status';
import { NotFoundPage } from './NotFoundPage';

export function StoryPage() {
  const { slug = '' } = useParams();
  const state = useApi(`story:${slug}`, (signal) => api.testimony(slug, signal));
  usePageTitle(state.status === 'success' ? state.data.title : undefined);

  if (state.status === 'error') {
    const status = state.error instanceof ApiRequestError ? state.error.status : 0;
    if (status === 404 || status === 400) return <NotFoundPage />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <article className="mx-auto max-w-[40rem] pb-20 pt-10 sm:pt-16">
        <Link
          to="/"
          className="text-sm text-slate underline-offset-4 hover:text-night hover:underline"
        >
          All stories
        </Link>

        {state.status === 'loading' && <Loading label="Loading story…" />}
        {state.status === 'error' && (
          <ErrorMessage>
            This story couldn’t be loaded. Check your connection and refresh the page.
          </ErrorMessage>
        )}

        {state.status === 'success' && (
          <>
            <header className="mt-6 border-b border-line pb-6">
              <h1 className="font-serif text-4xl font-semibold leading-[1.15] tracking-tight text-night sm:text-5xl">
                {state.data.title}
              </h1>
              <div className="mt-4">
                <StoryByline story={state.data} />
              </div>
            </header>
            <div className="mt-8 space-y-6 font-serif text-[1.15rem] leading-[1.75] text-ink [&>p:first-child]:text-[1.3rem] [&>p:first-child]:leading-[1.6]">
              {toParagraphs(state.data.body).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <NextStep />
          </>
        )}
      </article>
    </div>
  );
}
