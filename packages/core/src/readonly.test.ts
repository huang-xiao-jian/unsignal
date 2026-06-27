import { computed, signal, type ReadonlySignal } from '@unsignal/baseline';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { readonly } from './readonly';

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
