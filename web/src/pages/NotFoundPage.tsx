import { Link } from 'react-router';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold text-night">This page isn’t here</h1>
      <p className="mt-4 max-w-prose text-lg text-slate">
        The link may be old, or the story may have been removed by the person who shared it.
      </p>
      <p className="mt-8 flex flex-wrap gap-4">
        <Link to="/" className="rounded-full bg-night px-6 py-2.5 font-medium text-white">
          Read other stories
        </Link>
        <Link
          to="/know-jesus"
          className="rounded-full border border-night px-6 py-2.5 font-medium text-night"
        >
          Learn how to know Jesus
        </Link>
      </p>
    </div>
  );
}
