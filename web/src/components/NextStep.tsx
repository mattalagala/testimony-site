import { Link } from 'react-router';

/**
 * The next step toward Jesus. Appears on every story — this is the site's main job.
 */
export function NextStep({
  heading = 'Want to know the Jesus in this story?',
}: {
  heading?: string;
}) {
  return (
    <aside
      aria-labelledby="next-step-heading"
      className="mt-16 rounded-2xl bg-night px-6 py-8 text-white sm:px-10 sm:py-10"
    >
      <h2
        id="next-step-heading"
        className="font-serif text-2xl font-semibold leading-snug sm:text-3xl"
      >
        {heading}
      </h2>
      <p className="mt-3 max-w-prose text-white/85">
        He hasn’t changed. What He did for them, He can do for you — starting with forgiveness and a
        new life with God.
      </p>
      <Link
        to="/know-jesus"
        className="mt-6 inline-block rounded-full bg-dawn px-6 py-3 font-semibold text-night transition-colors hover:bg-[#f5c46d]"
      >
        Find out how to know Him
      </Link>
    </aside>
  );
}
