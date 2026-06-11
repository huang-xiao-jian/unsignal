import type { EffectOptions } from '@preact/signals-core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.doUnmock('@preact/signals-core');
  vi.resetModules();
});

describe('useSignalEffect options', () => {
  it('should pass options to the inner signal effect', async () => {
    const options: EffectOptions = { name: 'tracked effect' };
    const effectSpy = vi.fn().mockReturnValue(() => undefined);

    vi.doMock('@preact/signals-core', () => ({
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
