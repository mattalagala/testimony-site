import { NavLink, Outlet, ScrollRestoration } from 'react-router';
import { SITE_NAME } from '../lib/site';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-1 py-1 text-[0.95rem] transition-colors ${
    isActive
      ? 'text-white underline decoration-dawn decoration-2 underline-offset-8'
      : 'text-white/80 hover:text-white'
  }`;

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="bg-night">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
          <NavLink to="/" className="font-serif text-xl font-semibold tracking-tight text-white">
            {SITE_NAME}
          </NavLink>
          <nav aria-label="Main" className="flex items-center gap-6">
            <NavLink to="/" end className={navClass}>
              Stories
            </NavLink>
            <NavLink to="/know-jesus" className={navClass}>
              Know Jesus
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-slate sm:flex-row sm:justify-between sm:px-6">
          <p>
            “Come and see what God has done.” <span className="whitespace-nowrap">Psalm 66:5</span>
          </p>
          <p>Every story is shared with permission and reviewed before it’s published.</p>
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
