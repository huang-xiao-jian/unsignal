import { effect } from '@preact/signals-core';
import type { DisposerFn } from './reaction.js';

export type OnCleanup = (cleanupFn: () => void) => void;

export function watchEffect(fn: (onCleanup: OnCleanup) => void): DisposerFn {
  let cleanups: (() => void)[] = [];

  const runCleanups = () => {
    for (const c of cleanups) c();
    cleanups = [];
  };

  const onCleanup: OnCleanup = (cleanupFn) => {
    cleanups.push(cleanupFn);
  };

  const dispose = effect(() => {
    runCleanups();
    fn(onCleanup);
  });

  return () => {
    runCleanups();
    dispose();
  };
}
