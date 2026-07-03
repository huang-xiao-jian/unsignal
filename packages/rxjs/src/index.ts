import { Disposable, effect, signal, type ReadonlySignal, type Signal } from '@unsignal/baseline';
import { Observable, type Subscription } from 'rxjs';

export interface ToSignalOptions<T> {
  initialValue?: T;
}

export interface ReadonlySignalLike<TValue> {
  readonly value: TValue;
  peek(): TValue;
}

export interface ObservableSignal<TValue> extends ReadonlySignalLike<TValue> {
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

class ObservableSignalView<TValue> implements ObservableSignal<TValue> {
  private readonly disposable: Disposable;

  public constructor(
    private readonly valueSignal: Signal<TValue>,
    subscription: Subscription
  ) {
    this.disposable = new Disposable(() => {
      subscription.unsubscribe();
    });
  }

  public get value(): TValue {
    return this.valueSignal.value;
  }

  public peek(): TValue {
    return this.valueSignal.peek();
  }

  public dispose(): void {
    this.disposable.dispose();
  }
}

export function toSignal<T>(
  source$: Observable<T>,
  options: ToSignalOptions<T> & { initialValue: T }
): ObservableSignal<T>;
export function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): ObservableSignal<T | undefined>;
export function toSignal<T>(
  source$: Observable<T>,
  options?: ToSignalOptions<T>
): ObservableSignal<T | undefined> {
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

  return new ObservableSignalView(value, subscription);
}
