import { Disposable, DisposeFn, effect } from '@unsignal/baseline';
import { Cleaner, OnCleanup } from './clean';

export function watchEffect(fn: (onCleanup: OnCleanup) => void): Disposable {
  const state = {
    disposed: false,
  };
  const cleaner = new Cleaner();
  const disposable = effect(() => {
    // Cleanup previous run
    cleaner.cleanup();
    // Run the effect with manual cleanup registration
    fn(cleaner.onCleanup);
  });

  const disposeFn: DisposeFn = () => {
    if (state.disposed) {
      return;
    }
    state.disposed = true;

    // Cleanup the disposers
    cleaner.cleanup();

    // Cleanup the effect
    disposable.dispose();
  };

  return new Disposable(disposeFn);
}
