import { Link } from 'react-router';
import type { CategoryDto } from '@testimony/shared';

const base =
  'inline-block whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-colors';
const on = 'border-night bg-night text-white';
const off = 'border-line bg-paper text-ink hover:border-night-soft';

export function CategoryFilter({
  categories,
  active,
}: {
  categories: CategoryDto[];
  active: string | undefined;
}) {
  return (
    <nav
      aria-label="Filter stories by topic"
      className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-2 sm:flex-wrap">
        <li>
          <Link
            to="/"
            className={`${base} ${active ? off : on}`}
            aria-current={active ? undefined : 'page'}
          >
            All stories
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              to={`/?category=${c.slug}`}
              className={`${base} ${active === c.slug ? on : off}`}
              aria-current={active === c.slug ? 'page' : undefined}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
