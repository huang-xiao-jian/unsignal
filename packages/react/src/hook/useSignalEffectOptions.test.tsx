import { cleanup, render } from '@testing-library/react';
import type { EffectOptions } from '@unsignal/baseline';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.doUnmock('@unsignal/baseline');
  vi.resetModules();
});

describe('useSignalEffect options', () => {
  it('should pass options to the inner signal effect', async () => {
    const options: EffectOptions = { name: 'tracked effect' };
    const effectSpy = vi.fn().mockReturnValue({
      dispose: () => undefined,
      unsubscribe: () => undefined,
      [Symbol.dispose]: () => undefined,
    });

    vi.doMock('@unsignal/baseline', () => ({
      effect: effectSpy,
    }));

    const { useSignalEffect } = await import('./useSignalEffect');

    function Consumer() {
      useSignalEffect(() => undefined, options);
      return null;
    }

    render(<Consumer />);
    expect(effectSpy).toHaveBeenCalledWith(expect.any(Function), options);
  });
});
