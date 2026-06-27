import { effect, untracked, type Disposable } from '@unsignal/baseline';

export function reaction(fn: () => void, callback: () => void): Disposable {
  let isFirstRun = true;

  const disposable = effect(() => {
    fn();
    if (isFirstRun) {
      isFirstRun = false;
    } else {
      untracked(callback);
    }
  });

  return disposable;
}
