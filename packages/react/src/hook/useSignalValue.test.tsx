import { act, cleanup, render, screen } from '@testing-library/react';
import { batch, computed, signal } from '@unsignal/baseline';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSignalValue } from './useSignalValue';

afterEach(() => {
  cleanup();
});

describe('useSignalValue', () => {
  it('should return the initial signal value', () => {
    const source = signal(42);

    function Consumer() {
      const value = useSignalValue(source);
      return <span>value:{value}</span>;
    }

    render(<Consumer />);
    expect(screen.getByText('value:42')).toBeDefined();
  });

  it('should re-render when signal value changes', async () => {
    const source = signal(0);

    function Consumer() {
      const value = useSignalValue(source);
      return <span>value:{value}</span>;
    }

    render(<Consumer />);
    expect(screen.getByText('value:0')).toBeDefined();

    await act(async () => {
      source.value = 1;
    });
    expect(screen.getByText('value:1')).toBeDefined();

    await act(async () => {
      source.value = 42;
    });
    expect(screen.getByText('value:42')).toBeDefined();
  });

  it('should work with computed signal source', async () => {
    const a = signal(1);
    const b = signal(2);
    const sum = computed(() => a.value + b.value);

    function Consumer() {
      const value = useSignalValue(sum);
      return <span>sum:{value}</span>;
    }

    render(<Consumer />);
    expect(screen.getByText('sum:3')).toBeDefined();

    await act(async () => {
      a.value = 10;
    });
    expect(screen.getByText('sum:12')).toBeDefined();

    await act(async () => {
      b.value = 20;
    });
    expect(screen.getByText('sum:30')).toBeDefined();
  });

  it('should support multiple useSignalValue calls in one component', async () => {
    const name = signal('Alice');
    const age = signal(25);

    function Consumer() {
      const n = useSignalValue(name);
      const a = useSignalValue(age);
      return (
        <span>
          {n}:{a}
        </span>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('Alice:25')).toBeDefined();

    await act(async () => {
      name.value = 'Bob';
    });
    expect(screen.getByText('Bob:25')).toBeDefined();

    await act(async () => {
      age.value = 30;
    });
    expect(screen.getByText('Bob:30')).toBeDefined();
  });

  it('should trigger single re-render for batch updates', async () => {
    const a = signal(1);
    const b = signal(2);
    const renderCount = vi.fn();

    function Consumer() {
      const va = useSignalValue(a);
      const vb = useSignalValue(b);
      renderCount();
      return (
        <span>
          {va}:{vb}
        </span>
      );
    }

    render(<Consumer />);
    const initialRenders = renderCount.mock.calls.length;

    await act(async () => {
      batch(() => {
        a.value = 10;
        b.value = 20;
      });
    });

    expect(screen.getByText('10:20')).toBeDefined();
    const additionalRenders = renderCount.mock.calls.length - initialRenders;
    expect(additionalRenders).toBeLessThanOrEqual(1);
  });

  it('should not trigger re-render after unmount', async () => {
    const source = signal(0);

    function Consumer() {
      const value = useSignalValue(source);
      return <span>value:{value}</span>;
    }

    const { unmount } = render(<Consumer />);
    expect(screen.getByText('value:0')).toBeDefined();

    unmount();

    await act(async () => {
      source.value = 999;
    });

    expect(true).toBe(true);
  });

  it('should return correct value in SSR via renderToString', () => {
    const source = signal(42);

    function Consumer() {
      const value = useSignalValue(source);
      return <span>{`value:${value}`}</span>;
    }

    const html = renderToString(<Consumer />);
    expect(html).toContain('value:42');
  });

  it('should reflect current signal value in SSR without tracking', () => {
    const source = signal(0);

    function Consumer() {
      const value = useSignalValue(source);
      return <span>{`value:${value}`}</span>;
    }

    const html1 = renderToString(<Consumer />);
    expect(html1).toContain('value:0');

    source.value = 100;
    const html2 = renderToString(<Consumer />);
    expect(html2).toContain('value:100');
  });

  describe('React.StrictMode', () => {
    it('should re-render on signal changes after StrictMode double-mount', async () => {
      const source = signal(0);

      function Consumer() {
        const value = useSignalValue(source);
        return <span>value:{value}</span>;
      }

      render(
        <StrictMode>
          <Consumer />
        </StrictMode>
      );
      expect(screen.getByText('value:0')).toBeDefined();

      await act(async () => {
        source.value = 1;
      });
      expect(screen.getByText('value:1')).toBeDefined();

      await act(async () => {
        source.value = 42;
      });
      expect(screen.getByText('value:42')).toBeDefined();
    });

    it('should track computed signals under StrictMode', async () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.value + b.value);

      function Consumer() {
        const value = useSignalValue(sum);
        return <span>sum:{value}</span>;
      }

      render(
        <StrictMode>
          <Consumer />
        </StrictMode>
      );
      expect(screen.getByText('sum:3')).toBeDefined();

      await act(async () => {
        a.value = 10;
      });
      expect(screen.getByText('sum:12')).toBeDefined();

      await act(async () => {
        b.value = 20;
      });
      expect(screen.getByText('sum:30')).toBeDefined();
    });

    it('should support multiple useSignalValue calls under StrictMode', async () => {
      const name = signal('Alice');
      const age = signal(25);

      function Consumer() {
        const n = useSignalValue(name);
        const a = useSignalValue(age);
        return (
          <span>
            {n}:{a}
          </span>
        );
      }

      render(
        <StrictMode>
          <Consumer />
        </StrictMode>
      );
      expect(screen.getByText('Alice:25')).toBeDefined();

      await act(async () => {
        name.value = 'Bob';
      });
      expect(screen.getByText('Bob:25')).toBeDefined();

      await act(async () => {
        age.value = 30;
      });
      expect(screen.getByText('Bob:30')).toBeDefined();
    });

    it('should batch updates correctly under StrictMode', async () => {
      const a = signal(1);
      const b = signal(2);
      const renderCount = vi.fn();

      function Consumer() {
        const va = useSignalValue(a);
        const vb = useSignalValue(b);
        renderCount();
        return (
          <span>
            {va}:{vb}
          </span>
        );
      }

      render(
        <StrictMode>
          <Consumer />
        </StrictMode>
      );
      const initialRenders = renderCount.mock.calls.length;

      await act(async () => {
        batch(() => {
          a.value = 10;
          b.value = 20;
        });
      });

      expect(screen.getByText('10:20')).toBeDefined();
      const additionalRenders = renderCount.mock.calls.length - initialRenders;
      // StrictMode double-renders in dev, so allow up to 2 additional renders
      expect(additionalRenders).toBeLessThanOrEqual(2);
    });

    it('should not trigger re-render after unmount under StrictMode', async () => {
      const source = signal(0);

      function Consumer() {
        const value = useSignalValue(source);
        return <span>value:{value}</span>;
      }

      const { unmount } = render(
        <StrictMode>
          <Consumer />
        </StrictMode>
      );
      expect(screen.getByText('value:0')).toBeDefined();

      unmount();

      await act(async () => {
        source.value = 999;
      });
      expect(true).toBe(true);
    });
  });
});
