import { effect, untracked } from '@preact/signals-core';

export type DisposerFn = () => void;

export function reaction(fn: () => void, callback: () => void): DisposerFn {
  let isFirstRun = true;

  const dispose = effect(() => {
    fn();
    if (isFirstRun) {
      isFirstRun = false;
    } else {
      untracked(callback);
    }
  });

  return dispose;
}
