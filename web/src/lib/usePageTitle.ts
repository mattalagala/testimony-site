import { useEffect } from 'react';
import { SITE_NAME } from './site';

export function usePageTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
