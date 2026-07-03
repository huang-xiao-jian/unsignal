import { signal } from '@unsignal/baseline';
import { Observable, Subject } from 'rxjs';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { ObservableSignal, ReadonlySignalLike } from './index';
import { toObservable, toSignal } from './index';

describe('toObservable', () => {
  it('should emit the current signal value immediately and later updates', () => {
    const count = signal(1);
    const values: number[] = [];
    const subscription = toObservable(count).subscribe((value) => {
      values.push(value);
    });

    count.value = 2;
    count.value = 3;

    expect(values).toEqual([1, 2, 3]);

    subscription.unsubscribe();
  });

  it('should stop emitting after unsubscribe', () => {
    const count = signal(0);
    const values: number[] = [];
    const subscription = toObservable(count).subscribe((value) => {
      values.push(value);
    });

    subscription.unsubscribe();
    count.value = 1;

    expect(values).toEqual([0]);
  });

  it('should remain active until unsubscribe and not complete on its own', () => {
    const count = signal(5);
    const complete = vi.fn();
    const subscription = toObservable(count).subscribe({
      complete,
    });

    count.value = 6;
    count.value = 7;

    expect(complete).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });
});

describe('toSignal', () => {
  it('should subscribe eagerly when constructed', () => {
    let subscriptions = 0;
    const source$ = new Observable<number>(() => {
      subscriptions += 1;
      return () => undefined;
    });

    const view = toSignal(source$);

    expect(subscriptions).toBe(1);

    view.dispose();
  });

  it('should expose undefined before the first emission when no initial value is provided', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$);

    expect(view.value).toBeUndefined();
    expect(view.peek()).toBeUndefined();

    view.dispose();
  });

  it('should narrow the value type when initialValue is provided', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$, { initialValue: 1 });

    expectTypeOf(view).toEqualTypeOf<ObservableSignal<number>>();
    expectTypeOf(view).toExtend<ReadonlySignalLike<number>>();
    expect(view.value).toBe(1);

    view.dispose();
  });

  it('should update the latest value from observable emissions', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$);

    source$.next(2);
    source$.next(4);

    expect(view.value).toBe(4);
    expect(view.peek()).toBe(4);

    view.dispose();
  });

  it('should retain the latest reflected value after source error', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$, { initialValue: 0 });

    source$.next(3);
    source$.error(new Error('boom'));

    expect(view.value).toBe(3);

    view.dispose();
  });

  it('should retain the latest reflected value after source completion', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$, { initialValue: 0 });

    source$.next(7);
    source$.complete();

    expect(view.value).toBe(7);

    view.dispose();
  });

  it('should expose only the signal-like facade contract', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$, { initialValue: 1 });

    expect(view.value).toBe(1);
    expect(view.peek()).toBe(1);
    expect('subscribe' in view).toBe(false);
    expect('toJSON' in view).toBe(false);

    view.dispose();
  });

  it('should stop updating after dispose', () => {
    const source$ = new Subject<number>();
    const view = toSignal(source$, { initialValue: 1 });

    view.dispose();
    source$.next(9);

    expect(view.value).toBe(1);
  });
});
