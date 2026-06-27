import { DisposeFn } from '@unsignal/baseline';

export type OnCleanup = (cleanupFn: DisposeFn) => void;

/**
 * Manage cleanups for a watchEffect.
 *
 * 1. provide DisposerFn registration with explicit "this" context
 * 2. cleanup the disposers when called
 */
export class Cleaner {
  private disposers: DisposeFn[] = [];

  cleanup() {
    for (const disposer of this.disposers) {
      disposer();
    }
    this.disposers = [];
  }

  onCleanup: OnCleanup = (disposer: DisposeFn) => {
    this.disposers.push(disposer);
  };
}
