import { useEffect, useState } from 'react';

export type ApiState<T> =
  { status: 'loading' } | { status: 'error'; error: Error } | { status: 'success'; data: T };

/** Fetch on mount / when `key` changes; aborts stale requests. */
export function useApi<T>(key: string, load: (signal: AbortSignal) => Promise<T>): ApiState<T> {
  const [state, setState] = useState<{ key: string; value: ApiState<T> }>({
    key,
    value: { status: 'loading' },
  });

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => setState({ key, value: { status: 'success', data } }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          value: {
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          },
        });
      },
    );
    return () => controller.abort();
    // `load` is expected to be derived from `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key ? state.value : { status: 'loading' };
}
