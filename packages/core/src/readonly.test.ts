import { computed, signal, type ReadonlySignal } from '@unsignal/baseline';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { asReadonly, readonly } from './readonly';

describe('readonly', () => {
  it('should mirror updates from a writable signal', () => {
    const count = signal(0);

    const view = readonly(count);

    expect(view.value).toBe(0);

    count.value = 1;
    expect(view.value).toBe(1);
  });

  it('should return the same instance for an existing readonly signal', () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);

    const view = readonly(doubled);

    expect(view).not.toBe(doubled);
    expect(view.value).toBe(4);
  });

  it('should expose a readonly signal type for writable sources', () => {
    const count = signal(0);

    const view = readonly(count);

    expectTypeOf(view).toEqualTypeOf<ReadonlySignal<number>>();
  });
});

class SignalContainer {
  public readonly count = signal(1);
  public readonly nested = {
    label: 'nested',
    total: signal(2),
  };

  public getLabel(): string {
    return this.nested.label;
  }
}

describe('asReadonly', () => {
  it('should return the same signal instance for direct signal input', () => {
    const count = signal(0);

    const view = asReadonly(count);

    expect(view).toBe(count);
    expect(view.value).toBe(0);
  });

  it('should expose a readonly signal type for direct signal input', () => {
    const count = signal(0);

    const view = asReadonly(count);

    expectTypeOf(view).toEqualTypeOf<ReadonlySignal<number>>();
  });

  it('should narrow top-level signal members in shallow mode only', () => {
    const source = {
      count: signal(1),
      nested: {
        total: signal(2),
      },
    };

    const view = asReadonly(source);

    expect(view).toBe(source);
    expect(view.count.value).toBe(1);
    expect(view.nested.total.value).toBe(2);

    expectTypeOf(view.count).toEqualTypeOf<ReadonlySignal<number>>();
    expectTypeOf(view.nested.total).toEqualTypeOf(source.nested.total);
  });

  it('should narrow nested signal members in deep mode', () => {
    const source = {
      count: signal(1),
      nested: {
        total: signal(2),
      },
    };

    const view = asReadonly(source, { deep: true });

    expect(view).toBe(source);
    expect(view.count.value).toBe(1);
    expect(view.nested.total.value).toBe(2);

    expectTypeOf(view.count).toEqualTypeOf<ReadonlySignal<number>>();
    expectTypeOf(view.nested.total).toEqualTypeOf<ReadonlySignal<number>>();
  });

  it('should preserve class instance members and methods', () => {
    const source = new SignalContainer();

    const view = asReadonly(source, { deep: true });

    expect(view).toBe(source);
    expect(view.count.value).toBe(1);
    expect(view.nested.total.value).toBe(2);
    expect(view.getLabel()).toBe('nested');

    expectTypeOf(view.count).toEqualTypeOf<ReadonlySignal<number>>();
    expectTypeOf(view.nested.total).toEqualTypeOf<ReadonlySignal<number>>();
    expectTypeOf(view.getLabel).toEqualTypeOf(source.getLabel);
  });
});
