import { act, cleanup, render, screen } from '@testing-library/react';
import { signal } from '@unsignal/baseline';
import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSignalEffect } from './useSignalEffect';

afterEach(() => {
  cleanup();
});

describe('useSignalEffect', () => {
  it('should run immediately and re-run when tracked signal changes', async () => {
    const count = signal(0);
    const spy = vi.fn();

    function Consumer() {
      useSignalEffect(() => {
        spy(count.value);
      });
      return null;
    }

    render(<Consumer />);
    expect(spy).toHaveBeenLastCalledWith(0);

    await act(async () => {
      count.value = 1;
    });
    expect(spy).toHaveBeenLastCalledWith(1);
  });

  it('should run cleanup before the next execution and on unmount', async () => {
    const count = signal(0);
    const cleanupSpy = vi.fn();

    function Consumer() {
      useSignalEffect(() => {
        void count.value;
        return cleanupSpy;
      });
      return null;
    }

    const { unmount } = render(<Consumer />);
    expect(cleanupSpy).not.toHaveBeenCalled();

    await act(async () => {
      count.value = 1;
    });
    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(cleanupSpy).toHaveBeenCalledTimes(2);
  });

  it('should not recreate the signal effect when only options change', async () => {
    const cleanupSpy = vi.fn();
    const runSpy = vi.fn();

    function Consumer() {
      const [name, setName] = useState('first');

      useSignalEffect(
        () => {
          runSpy();
          return cleanupSpy;
        },
        { name }
      );

      return <button onClick={() => setName('second')}>rename</button>;
    }

    render(<Consumer />);
    expect(runSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      screen.getByText('rename').click();
    });

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(cleanupSpy).not.toHaveBeenCalled();
  });

  it('should work under React.StrictMode', async () => {
    const count = signal(0);
    const spy = vi.fn();

    function Consumer() {
      useSignalEffect(() => {
        spy(count.value);
      });
      return null;
    }

    render(
      <StrictMode>
        <Consumer />
      </StrictMode>
    );

    await act(async () => {
      count.value = 2;
    });

    expect(spy).toHaveBeenLastCalledWith(2);
  });
});
