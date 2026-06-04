import { signal } from '@preact/signals-core';
import { describe, expect, it } from 'vitest';
import { effectScope, type ShallowRef } from 'vue';
import { useSignalState } from './useSignalState';

describe('useSignalState', () => {
  it('should return readonly ref and mutate function as tuple', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const result = useSignalState(source);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      const [ref, mutate] = result;
      expect(typeof mutate).toBe('function');
      expect(ref.value).toBe(0);
    });

    scope.stop();
  });

  it('should accept plain value (non-function) and assign to signal', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);
      mutate(42);
      expect(source.value).toBe(42);
      expect(ref.value).toBe(42);
    });

    scope.stop();
  });

  it('should accept function updater returning new value (primitive)', () => {
    const source = signal(10);
    const scope = effectScope();

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);
      mutate((v) => v + 5);
      expect(source.value).toBe(15);
      expect(ref.value).toBe(15);

      mutate((v) => v * 2);
      expect(source.value).toBe(30);
      expect(ref.value).toBe(30);
    });

    scope.stop();
  });

  it('should support immer mutating style on object (returning void)', () => {
    interface User {
      name: string;
      age: number;
    }
    const source = signal<User>({ name: 'Alice', age: 30 });
    const scope = effectScope();

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);
      const before = source.value;

      mutate((draft) => {
        draft.age = 31;
        draft.name = 'Bob';
      });

      expect(source.value).toEqual({ name: 'Bob', age: 31 });
      expect(source.value).not.toBe(before);
      expect(ref.value).toEqual({ name: 'Bob', age: 31 });
    });

    scope.stop();
  });

  it('should support immer mutating style on array', () => {
    interface Todo {
      id: number;
      text: string;
    }
    const source = signal<Todo[]>([
      { id: 1, text: 'first' },
      { id: 2, text: 'second' },
    ]);
    const scope = effectScope();

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);
      const before = source.value;

      mutate((draft) => {
        draft.push({ id: 3, text: 'third' });
        draft[0].text = 'updated';
      });

      expect(source.value).toHaveLength(3);
      expect(source.value[0].text).toBe('updated');
      expect(source.value[2]).toEqual({ id: 3, text: 'third' });
      expect(source.value).not.toBe(before);
      expect(ref.value).toHaveLength(3);
    });

    scope.stop();
  });

  it('should not mutate the original signal value reference (immutability)', () => {
    interface State {
      count: number;
    }
    const source = signal<State>({ count: 0 });
    const scope = effectScope();

    scope.run(() => {
      const [, mutate] = useSignalState(source);
      const originalRef = source.value;

      mutate((draft) => {
        draft.count = 1;
      });

      // 原始对象未被修改（immutable）
      expect(originalRef.count).toBe(0);
      // signal 的值是新引用
      expect(source.value).not.toBe(originalRef);
      expect(source.value.count).toBe(1);
    });

    scope.stop();
  });

  it('should reactively propagate mutations to ref', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);
      mutate((v) => v + 1);
      expect(ref.value).toBe(source.value);
      mutate((v) => v + 1);
      expect(ref.value).toBe(source.value);
    });

    scope.stop();
  });

  it('should clean up signal subscription on scope stop', () => {
    const source = signal(0);
    const scope = effectScope();
    let captured: Readonly<ShallowRef<number>> | undefined;

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);
      captured = ref;
      mutate(1);
      expect(ref.value).toBe(1);
    });

    // scope 已 stop
    scope.stop();

    // mutate signal，但 ref 不再同步
    source.value = 999;
    expect(captured?.value).toBe(1);
  });

  it('should return peek value and track updates even without effect scope', () => {
    const source = signal(0);

    // 无活跃 effect scope（顶层调用 / 非组件上下文）
    const [ref, mutate] = useSignalState(source);
    expect(ref.value).toBe(0);

    // mutate 仍然能修改 signal（因为这是直接写 signal.value）
    mutate(42);
    expect(source.value).toBe(42);

    // effect 仍然创建，ref 会同步更新
    expect(ref.value).toBe(42);
  });

  it('should accept nested immer-style mutation on objects', () => {
    interface Nested {
      inner: { value: number };
      outer: number;
    }
    const source = signal<Nested>({ inner: { value: 0 }, outer: 0 });
    const scope = effectScope();

    scope.run(() => {
      const [ref, mutate] = useSignalState(source);

      mutate((draft) => {
        draft.inner.value = 100;
        draft.outer = 200;
      });

      expect(source.value).toEqual({ inner: { value: 100 }, outer: 200 });
      expect(ref.value).toEqual({ inner: { value: 100 }, outer: 200 });
    });

    scope.stop();
  });

  it('should return readonly ref at type level', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const [ref] = useSignalState(source);
      expect(ref.value).toBe(0);

      // 写访问在类型上被禁止
      // @ts-expect-error - readonly ShallowRef 不可写
      ref.value = 1;
    });

    scope.stop();
  });
});
