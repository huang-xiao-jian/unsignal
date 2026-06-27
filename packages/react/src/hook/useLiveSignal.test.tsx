import { act, cleanup, render, screen } from '@testing-library/react';
import { computed, effect } from '@unsignal/baseline';
import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLiveSignal } from './useLiveSignal';

afterEach(() => {
  cleanup();
});

describe('useLiveSignal', () => {
  it('should expose a stable signal that mirrors the latest React value', async () => {
    const identities: unknown[] = [];

    function Consumer() {
      const [count, setCount] = useState(1);
      const countSignal = useLiveSignal(count);
      const doubled = computed(() => countSignal.value * 2);

      identities.push(countSignal);

      return (
        <div>
          <span>value:{doubled.value}</span>
          <button onClick={() => setCount(2)}>set</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('value:2')).toBeDefined();

    await act(async () => {
      screen.getByText('set').click();
    });

    expect(screen.getByText('value:4')).toBeDefined();
    expect(identities[1]).toBe(identities[0]);
  });

  it('should notify signal consumers when the React value changes', async () => {
    const spy = vi.fn();

    function Consumer() {
      const [name, setName] = useState('Alice');
      const nameSignal = useLiveSignal(name);

      useState(() =>
        effect(() => {
          spy(nameSignal.value);
        })
      );

      return <button onClick={() => setName('Bob')}>rename</button>;
    }

    render(<Consumer />);
    expect(spy).toHaveBeenLastCalledWith('Alice');

    await act(async () => {
      screen.getByText('rename').click();
    });

    expect(spy).toHaveBeenLastCalledWith('Bob');
  });

  it('should use Object.is equality by default', async () => {
    const spy = vi.fn();

    function Consumer() {
      const [value, setValue] = useState(Number.NaN);
      const valueSignal = useLiveSignal(value);

      useState(() =>
        effect(() => {
          spy(valueSignal.value);
        })
      );

      return <button onClick={() => setValue(Number.NaN)}>set</button>;
    }

    render(<Consumer />);
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      screen.getByText('set').click();
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should support custom equality for mirrored values', async () => {
    const spy = vi.fn();

    interface User {
      id: number;
      name: string;
    }

    function Consumer() {
      const [user, setUser] = useState<User>({ id: 1, name: 'Alice' });
      const userSignal = useLiveSignal(user, {
        equals: (previous, next) => previous.id === next.id,
      });

      useState(() =>
        effect(() => {
          spy(userSignal.value.name);
        })
      );

      return (
        <div>
          <button onClick={() => setUser({ id: 1, name: 'Alicia' })}>rename</button>
          <button onClick={() => setUser({ id: 2, name: 'Bob' })}>replace</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(spy).toHaveBeenLastCalledWith('Alice');

    await act(async () => {
      screen.getByText('rename').click();
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith('Alice');

    await act(async () => {
      screen.getByText('replace').click();
    });

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith('Bob');
  });

  it('should work under React.StrictMode', async () => {
    function Consumer() {
      const [count, setCount] = useState(1);
      const countSignal = useLiveSignal(count);

      return (
        <div>
          <span>value:{countSignal.value}</span>
          <button onClick={() => setCount(3)}>set</button>
        </div>
      );
    }

    render(
      <StrictMode>
        <Consumer />
      </StrictMode>
    );
    expect(screen.getByText('value:1')).toBeDefined();

    await act(async () => {
      screen.getByText('set').click();
    });

    expect(screen.getByText('value:3')).toBeDefined();
  });
});
