import { useEffect, useRef } from 'react';

import { LiteSignalStore } from './LiteSignalStore';

/**
 * Instantiates a lite signal store scoped to the component lifecycle.
 * The store is lazily created and released for GC on unmount.
 */
export function useLiteSignalStore(): LiteSignalStore {
  const storeRef = useRef<LiteSignalStore | null>(null);

  if (storeRef.current === null) {
    storeRef.current = new LiteSignalStore();
  }

  useEffect(() => {
    return () => {
      storeRef.current?.dispose();
      storeRef.current = null;
    };
  }, []);

  return storeRef.current;
}
