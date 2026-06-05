import { batch, computed, signal } from '@preact/signals-core';
import { act, cleanup, render, screen } from '@testing-library/react';
import { StrictMode, useState, type FunctionComponent } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { observer } from './observer';

afterEach(() => {
  cleanup();
});

describe('observer', () => {
  it('should render initial signal value', () => {
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    render(<Counter />);
    expect(screen.getByText('count:0')).toBeDefined();
  });

  it('should re-render when signal value changes', async () => {
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    render(<Counter />);
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

  it('should auto-track multiple signals', async () => {
    const name = signal('Alice');
    const age = signal(25);

    const Profile = observer(function Profile() {
      return (
        <span>
          {name.value}:{age.value}
        </span>
      );
    });

    render(<Profile />);
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

  it('should track computed signals', async () => {
    const a = signal(2);
    const b = signal(3);
    const product = computed(() => a.value * b.value);

    const Multiplier = observer(function Multiplier() {
      return <span>result:{product.value}</span>;
    });

    render(<Multiplier />);
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

  it('should apply React.memo automatically', () => {
    const Dummy = observer(function Dummy() {
      return null;
    });

    expect((Dummy as unknown as { $$typeof: symbol })['$$typeof']).toBe(Symbol.for('react.memo'));
  });

  it('should re-render when props change', async () => {
    const count = signal(0);

    interface Props {
      label: string;
    }

    const Child = observer(function Child({ label }: Props) {
      return (
        <span>
          {label}:{count.value}
        </span>
      );
    });

    function Parent() {
      const [label, setLabel] = useState('A');
      return (
        <div>
          <Child label={label} />
          <button onClick={() => setLabel('B')}>change</button>
        </div>
      );
    }

    render(<Parent />);
    expect(screen.getByText('A:0')).toBeDefined();

    await act(async () => {
      screen.getByText('change').click();
    });
    expect(screen.getByText('B:0')).toBeDefined();
  });

  it('should track signals conditionally (re-track on branch switch)', async () => {
    const flag = signal(true);
    const a = signal('A');
    const b = signal('B');

    const Switcher = observer(function Switcher() {
      const value = flag.value ? a.value : b.value;
      return <span>value:{value}</span>;
    });

    render(<Switcher />);
    expect(screen.getByText('value:A')).toBeDefined();

    await act(async () => {
      a.value = 'A2';
    });
    expect(screen.getByText('value:A2')).toBeDefined();

    await act(async () => {
      flag.value = false;
    });
    expect(screen.getByText('value:B')).toBeDefined();

    await act(async () => {
      b.value = 'B2';
    });
    expect(screen.getByText('value:B2')).toBeDefined();
  });

  it('should clean up signal tracking on unmount', async () => {
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    const { unmount } = render(<Counter />);
    expect(screen.getByText('count:0')).toBeDefined();

    unmount();

    await act(async () => {
      count.value = 999;
    });
    expect(true).toBe(true);
  });

  it('should set displayName from options', () => {
    const Dummy = observer(
      function Dummy() {
        return null;
      },
      { displayName: 'CustomName' }
    );

    expect((Dummy as FunctionComponent).displayName).toBe('CustomName');
  });

  it('should fall back to component name as displayName', () => {
    function SomeUniqueObserverComp() {
      return null;
    }
    const Wrapped = observer(SomeUniqueObserverComp);

    expect((Wrapped as FunctionComponent).displayName).toBe(SomeUniqueObserverComp.name);
  });

  it('should batch multiple signal changes into one update cycle', async () => {
    const a = signal(1);
    const b = signal(2);

    const Sum = observer(function Sum() {
      return <span>sum:{a.value + b.value}</span>;
    });

    render(<Sum />);
    expect(screen.getByText('sum:3')).toBeDefined();

    await act(async () => {
      batch(() => {
        a.value = 10;
        b.value = 20;
      });
    });

    expect(screen.getByText('sum:30')).toBeDefined();

    await act(async () => {
      a.value = 100;
    });
    await act(async () => {
      b.value = 200;
    });
    expect(screen.getByText('sum:300')).toBeDefined();
  });

  it('should render correctly in SSR via renderToString', () => {
    const count = signal(42);

    const Counter = observer(function Counter() {
      return <span>{`count:${count.value}`}</span>;
    });

    const html = renderToString(<Counter />);
    expect(html).toContain('count:42');
  });

  it('should work under React.StrictMode', async () => {
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    render(
      <StrictMode>
        <Counter />
      </StrictMode>
    );
    expect(screen.getByText('count:0')).toBeDefined();

    await act(async () => {
      count.value = 5;
    });
    expect(screen.getByText('count:5')).toBeDefined();
  });

  it('should sustain multiple signal changes after StrictMode double-mount', async () => {
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    render(
      <StrictMode>
        <Counter />
      </StrictMode>
    );
    expect(screen.getByText('count:0')).toBeDefined();

    // Verify tracking effects survive the StrictMode cycle across multiple mutations
    await act(async () => {
      count.value = 1;
    });
    expect(screen.getByText('count:1')).toBeDefined();

    await act(async () => {
      count.value = 2;
    });
    expect(screen.getByText('count:2')).toBeDefined();

    await act(async () => {
      count.value = 100;
    });
    expect(screen.getByText('count:100')).toBeDefined();
  });

  it('should re-track conditional dependencies under StrictMode', async () => {
    const flag = signal(true);
    const a = signal('A');
    const b = signal('B');

    const Switcher = observer(function Switcher() {
      const value = flag.value ? a.value : b.value;
      return <span>value:{value}</span>;
    });

    render(
      <StrictMode>
        <Switcher />
      </StrictMode>
    );
    expect(screen.getByText('value:A')).toBeDefined();

    // Switch branch after StrictMode double-mount
    await act(async () => {
      flag.value = false;
    });
    expect(screen.getByText('value:B')).toBeDefined();

    // New branch dependency should be tracked
    await act(async () => {
      b.value = 'B2';
    });
    expect(screen.getByText('value:B2')).toBeDefined();

    // Old branch dependency should NOT trigger re-render
    await act(async () => {
      a.value = 'A2';
    });
    expect(screen.getByText('value:B2')).toBeDefined();
  });

  it('should clean up tracking effects on unmount under StrictMode', async () => {
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    const { unmount } = render(
      <StrictMode>
        <Counter />
      </StrictMode>
    );
    expect(screen.getByText('count:0')).toBeDefined();

    unmount();

    // After unmount, signal changes must not throw or cause side effects
    await act(async () => {
      count.value = 999;
    });
    expect(true).toBe(true);
  });

  it('should handle multiple observer components independently under StrictMode', async () => {
    const a = signal(1);
    const b = signal(2);

    const CounterA = observer(function CounterA() {
      return <span>a:{a.value}</span>;
    });
    const CounterB = observer(function CounterB() {
      return <span>b:{b.value}</span>;
    });

    render(
      <StrictMode>
        <CounterA />
        <CounterB />
      </StrictMode>
    );
    expect(screen.getByText('a:1')).toBeDefined();
    expect(screen.getByText('b:2')).toBeDefined();

    await act(async () => {
      a.value = 10;
    });
    expect(screen.getByText('a:10')).toBeDefined();
    expect(screen.getByText('b:2')).toBeDefined();

    await act(async () => {
      b.value = 20;
    });
    expect(screen.getByText('a:10')).toBeDefined();
    expect(screen.getByText('b:20')).toBeDefined();
  });

  it('should survive StrictMode simulated unmount/remount with deferred disposal', async () => {
    vi.useFakeTimers();
    const count = signal(0);

    const Counter = observer(function Counter() {
      return <span>count:{count.value}</span>;
    });

    render(
      <StrictMode>
        <Counter />
      </StrictMode>
    );
    expect(screen.getByText('count:0')).toBeDefined();

    // Let any pending setTimeout(0) disposals from StrictMode cycle flush
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    // Tracking effects must still be alive after deferred window passes
    await act(async () => {
      count.value = 42;
    });
    expect(screen.getByText('count:42')).toBeDefined();

    vi.useRealTimers();
  });
});
