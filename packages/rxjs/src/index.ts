import { Disposable, effect, signal, type ReadonlySignal, type Signal } from '@unsignal/baseline';
import { Observable, type Subscription } from 'rxjs';

export interface ToSignalOptions<T> {
  initialValue?: T;
}

export interface SignalSubscription<TValue> {
  readonly value: ReadonlySignal<TValue>;
  dispose(): void;
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

class ObservableSignalSubscription<TValue> implements SignalSubscription<TValue> {
  public readonly value: ReadonlySignal<TValue>;

  private readonly disposable: Disposable;

  public constructor(value: Signal<TValue>, subscription: Subscription) {
    this.value = value;
    this.disposable = new Disposable(() => {
      subscription.unsubscribe();
    });
  }

  public dispose(): void {
    this.disposable.dispose();
  }
}

export function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): SignalSubscription<T>;
export function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): SignalSubscription<T | undefined>;
export function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): SignalSubscription<T | undefined> {
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

  return new ObservableSignalSubscription(value, subscription);
}
