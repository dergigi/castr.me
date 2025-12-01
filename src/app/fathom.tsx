/* eslint-disable no-console */
'use client';

import { load, trackPageview } from 'fathom-client';
import type { ReactElement } from 'react';
import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function TrackPageView(): ReactElement | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FATHOM_ID) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Fathom Analytics: NEXT_PUBLIC_FATHOM_ID is not set, skipping initialization.');
      }
      return;
    }

    load(process.env.NEXT_PUBLIC_FATHOM_ID, {
      auto: false,
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;

    // Avoid tracking during local development
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    trackPageview({
      url: `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`,
      referrer: document.referrer,
    });
  }, [pathname, searchParams]);

  return null;
}

export function FathomAnalytics(): ReactElement {
  return (
    <Suspense fallback={null}>
      <TrackPageView />
    </Suspense>
  );
}


