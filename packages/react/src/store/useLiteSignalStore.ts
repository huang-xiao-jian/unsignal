import { useEffect, useState } from 'react';

import { LiteSignalStore } from './LiteSignalStore';

/**
 * Instantiates a lite signal store scoped to the component lifecycle.
 * The store is lazily created and released for GC on unmount.
 *
 * Uses useState lazy initializer to keep the store instance stable
 * across React StrictMode's simulated unmount/remount cycle.
 */
export function useLiteSignalStore(): LiteSignalStore {
  const [store] = useState(() => new LiteSignalStore());

  // Adapt the StrictMode simulated unmount/remount cycle, avoid render phase effects loss
  useEffect(() => {
    store.restore();

    return () => {
      store.release();
    };
  }, [store]);

  return store;
}
