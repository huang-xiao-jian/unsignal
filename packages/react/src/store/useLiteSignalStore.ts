import { useId } from 'react';

import { LiteSignalStore } from './LiteSignalStore';

const LITE_SIGNAL_STORES = new Map<string, LiteSignalStore>();

/**
 * Instantiates a lite signal store with memory cache.
 */
export function useLiteSignalStore(): LiteSignalStore {
  // the component level unique and stable id
  const id = useId();

  if (!LITE_SIGNAL_STORES.has(id)) {
    LITE_SIGNAL_STORES.set(id, new LiteSignalStore());
  }

  return LITE_SIGNAL_STORES.get(id)!;
}
