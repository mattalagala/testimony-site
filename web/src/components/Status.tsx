import type { ReactNode } from 'react';

export function Loading({ label }: { label: string }) {
  return (
    <p role="status" className="py-16 text-slate">
      {label}
    </p>
  );
}

export function ErrorMessage({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="my-10 rounded-xl bg-mist px-5 py-4">
      <p className="text-ink">{children}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-night px-4 py-1.5 text-sm font-medium text-night hover:bg-night hover:text-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
