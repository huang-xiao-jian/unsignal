import { signal } from '@preact/signals-core';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSignalState } from './useSignalState';

afterEach(() => {
  cleanup();
});

describe('useSignalState', () => {
  it('should return value and mutate function as tuple', () => {
    const source = signal(0);
    let captured: unknown[] | undefined;

    function Consumer() {
      const result = useSignalState(source);
      captured = result;
      return <span>value:{result[0]}</span>;
    }

    render(<Consumer />);
    expect(screen.getByText('value:0')).toBeDefined();
    expect(Array.isArray(captured)).toBe(true);
    expect(captured).toHaveLength(2);
    expect(typeof captured![1]).toBe('function');
  });

  it('should accept plain value (non-function) and assign to signal', async () => {
    const source = signal(0);

    function Consumer() {
      const [value, mutate] = useSignalState(source);
      return (
        <div>
          <span>value:{value}</span>
          <button onClick={() => mutate(42)}>set</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('value:0')).toBeDefined();

    await act(async () => {
      screen.getByText('set').click();
    });
    expect(screen.getByText('value:42')).toBeDefined();
    expect(source.value).toBe(42);
  });

  it('should accept function updater returning new value (primitive)', async () => {
    const source = signal(10);

    function Consumer() {
      const [value, mutate] = useSignalState(source);
      return (
        <div>
          <span>value:{value}</span>
          <button onClick={() => mutate((v) => v + 5)}>add</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('value:10')).toBeDefined();

    await act(async () => {
      screen.getByText('add').click();
    });
    expect(screen.getByText('value:15')).toBeDefined();
    expect(source.value).toBe(15);
  });

  it('should support immer mutating style on object (returning void)', async () => {
    interface User {
      name: string;
      age: number;
    }
    const source = signal<User>({ name: 'Alice', age: 30 });

    function Consumer() {
      const [value, mutate] = useSignalState(source);
      const onBirthday = () =>
        mutate((draft) => {
          draft.age += 1;
        });
      return (
        <div>
          <span>
            {value.name}:{value.age}
          </span>
          <button onClick={onBirthday}>birthday</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('Alice:30')).toBeDefined();

    await act(async () => {
      screen.getByText('birthday').click();
    });
    expect(screen.getByText('Alice:31')).toBeDefined();
    expect(source.value).toEqual({ name: 'Alice', age: 31 });
  });

  it('should support immer mutating style on array', async () => {
    interface Todo {
      id: number;
      text: string;
    }
    const source = signal<Todo[]>([{ id: 1, text: 'first' }]);

    function Consumer() {
      const [value, mutate] = useSignalState(source);
      const onAdd = () =>
        mutate((draft) => {
          draft.push({ id: 2, text: 'second' });
        });
      return (
        <div>
          <span>count:{value.length}</span>
          <button onClick={onAdd}>add</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('count:1')).toBeDefined();

    await act(async () => {
      screen.getByText('add').click();
    });
    expect(screen.getByText('count:2')).toBeDefined();
    expect(source.value).toHaveLength(2);
    expect(source.value[1]).toEqual({ id: 2, text: 'second' });
  });

  it('should not mutate the original signal value reference (immutability)', async () => {
    interface State {
      count: number;
    }
    const source = signal<State>({ count: 0 });
    const originalRef = source.value;

    function Consumer() {
      const [value, mutate] = useSignalState(source);
      const onIncrement = () =>
        mutate((draft) => {
          draft.count = 1;
        });
      return (
        <div>
          <span>count:{value.count}</span>
          <button onClick={onIncrement}>inc</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('count:0')).toBeDefined();

    await act(async () => {
      screen.getByText('inc').click();
    });

    expect(originalRef.count).toBe(0);
    expect(source.value).not.toBe(originalRef);
    expect(source.value.count).toBe(1);
  });

  it('should reactively propagate mutations to rendered value', async () => {
    const source = signal(0);

    function Consumer() {
      const [value, mutate] = useSignalState(source);
      return (
        <div>
          <span>value:{value}</span>
          <button onClick={() => mutate((v) => v + 1)}>inc</button>
        </div>
      );
    }

    render(<Consumer />);
    expect(screen.getByText('value:0')).toBeDefined();

    await act(async () => {
      screen.getByText('inc').click();
    });
    expect(screen.getByText('value:1')).toBeDefined();

    await act(async () => {
      screen.getByText('inc').click();
    });
    expect(screen.getByText('value:2')).toBeDefined();
    expect(source.value).toBe(2);
  });

  it('should not cause errors when mutate is called after unmount', async () => {
    const source = signal(0);
    let capturedMutate: ((v: number | ((d: number) => number)) => void) | undefined;

    function Consumer() {
      const [, mutate] = useSignalState(source);
      capturedMutate = mutate as typeof capturedMutate;
      return <span>value:{source.peek()}</span>;
    }

    const { unmount } = render(<Consumer />);
    expect(screen.getByText('value:0')).toBeDefined();

    unmount();

    await act(async () => {
      capturedMutate?.(999);
    });
    expect(source.value).toBe(999);
  });
});
