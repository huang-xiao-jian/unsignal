import { effect, signal, type ReadonlySignal } from '@unsignal/baseline';
import { Observable } from 'rxjs';

export interface ToSignalOptions<T> {
  initialValue?: T;
  signal?: AbortSignal;
}

export function toObservable<T>(source: ReadonlySignal<T>): Observable<T> {
  return new Observable<T>((subscriber) => {
    const disposable = effect(() => {
      subscriber.next(source.value);
    });

    return () => {
      disposable.dispose();
    };
  });
}

export function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): ReadonlySignal<T>;
export function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): ReadonlySignal<T | undefined>;
export function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): ReadonlySignal<T | undefined> {
  const value = signal<T | undefined>(options?.initialValue);
  const subscription = source$.subscribe({
    next(nextValue) {
      value.value = nextValue;
    },
    error() {
      // Retain the latest reflected value and let RxJS close the subscription.
    },
    complete() {
      // Retain the latest reflected value and let RxJS close the subscription.
    },
  });

  const abortSignal = options?.signal;
  if (abortSignal !== undefined) {
    const onAbort = () => {
      subscription.unsubscribe();
    };

    if (abortSignal.aborted) {
      onAbort();
    } else {
      abortSignal.addEventListener('abort', onAbort, { once: true });
      subscription.add(() => {
        abortSignal.removeEventListener('abort', onAbort);
      });
    }
  }

  return value;
}
