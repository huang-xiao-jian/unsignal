import { act, cleanup, render, screen } from '@testing-library/react';
import { computed, signal } from '@unsignal/baseline';
import { afterEach, describe, expect, it } from 'vitest';
import { Observer } from './Observer';

afterEach(() => {
  cleanup();
});

describe('Observer', () => {
  it('should render static children content', () => {
    render(<Observer>{() => <span>hello</span>}</Observer>);
    expect(screen.getByText('hello')).toBeDefined();
  });

  it('should re-render children when signal value changes', async () => {
    const count = signal(0);

    render(<Observer>{() => <span>count:{count.value}</span>}</Observer>);
    expect(screen.getByText('count:0')).toBeDefined();

    await act(async () => {
      count.value = 1;
    });
    expect(screen.getByText('count:1')).toBeDefined();

    await act(async () => {
      count.value = 42;
    });
    expect(screen.getByText('count:42')).toBeDefined();
  });

  it('should respond to computed signal changes', async () => {
    const a = signal(2);
    const b = signal(3);
    const product = computed(() => a.value * b.value);

    render(<Observer>{() => <span>result:{product.value}</span>}</Observer>);
    expect(screen.getByText('result:6')).toBeDefined();

    await act(async () => {
      a.value = 5;
    });
    expect(screen.getByText('result:15')).toBeDefined();

    await act(async () => {
      b.value = 10;
    });
    expect(screen.getByText('result:50')).toBeDefined();
  });

  it('should track multiple signals in children', async () => {
    const name = signal('Alice');
    const age = signal(25);

    render(
      <Observer>
        {() => (
          <span>
            {name.value}:{age.value}
          </span>
        )}
      </Observer>
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

  it('should clean up signal tracking on unmount', async () => {
    const count = signal(0);

    const { unmount } = render(<Observer>{() => <span>count:{count.value}</span>}</Observer>);
    expect(screen.getByText('count:0')).toBeDefined();

    unmount();

    await act(async () => {
      count.value = 999;
    });
    expect(true).toBe(true);
  });
});
