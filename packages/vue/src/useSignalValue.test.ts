import { computed, signal, type ReadonlySignal } from '@preact/signals-core';
import { describe, expect, it, vi } from 'vitest';
import {
  createSSRApp,
  defineComponent,
  effectScope,
  h,
  nextTick,
  computed as vueComputed,
  watch,
} from 'vue';
import { renderToString } from 'vue/server-renderer';
import { useSignalValue } from './useSignalValue';

describe('useSignalValue', () => {
  it('should return the initial signal value via peek', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(source);
      expect(ref.value).toBe(0);
    });

    scope.stop();
  });

  it('should reactively update ref when source signal changes', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(source);
      source.value = 1;
      expect(ref.value).toBe(1);
      source.value = 42;
      expect(ref.value).toBe(42);
    });

    scope.stop();
  });

  it('should work with computed signal source', () => {
    const a = signal(1);
    const b = signal(2);
    const sum: ReadonlySignal<number> = computed(() => a.value + b.value);
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(sum);
      expect(ref.value).toBe(3);

      a.value = 10;
      expect(ref.value).toBe(12);

      b.value = 20;
      expect(ref.value).toBe(30);
    });

    scope.stop();
  });

  it('should support multiple signal sources via computed', () => {
    const a = signal(1);
    const b = signal(2);
    const c = signal(3);
    const sum: ReadonlySignal<number> = computed(() => a.value + b.value + c.value);
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(sum);
      expect(ref.value).toBe(6);

      a.value = 10;
      expect(ref.value).toBe(15);

      c.value = 100;
      expect(ref.value).toBe(112);
    });

    scope.stop();
  });

  it('should not update ref after scope is stopped', () => {
    const source = signal(0);
    const scope = effectScope();
    let captured: Readonly<{ value: number }> | undefined;

    scope.run(() => {
      captured = useSignalValue(source);
    });

    source.value = 1;
    expect(captured?.value).toBe(1);

    scope.stop();

    source.value = 2;
    expect(captured?.value).toBe(1);
  });

  it('should return ShallowRef with no deep reactivity on object values', () => {
    interface State {
      x: number;
    }
    const source = signal<State>({ x: 1 });
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(source);
      const original = ref.value;
      expect(original.x).toBe(1);

      // shallow ref 不会追踪深变更；整体替换才响应
      source.value = { x: 2 };
      expect(ref.value.x).toBe(2);
      expect(ref.value).not.toBe(original);
    });

    scope.stop();
  });

  it('should return peek value and track updates even without effect scope', () => {
    const source = signal(100);

    // 无活跃 effect scope（顶层调用 / 非组件上下文）
    const ref = useSignalValue(source);
    expect(ref.value).toBe(100);

    // effect 仍然创建，ref 会同步更新
    source.value = 200;
    expect(ref.value).toBe(200);
  });

  it('should return readonly ShallowRef at type level', () => {
    const source = signal(0);
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(source);
      // 读访问是允许的
      expect(ref.value).toBe(0);

      // 写访问在类型上被禁止（Readonly<ShallowRef<T>>）
      // @ts-expect-error - readonly ShallowRef 不可写
      ref.value = 1;
    });

    scope.stop();
  });

  it('should render initial signal value in SSR context', async () => {
    const source = signal(42);

    const Comp = defineComponent({
      setup() {
        const ref = useSignalValue(source);
        return () => h('span', `value:${ref.value}`);
      },
    });

    const app = createSSRApp(Comp);
    const html = await renderToString(app);
    expect(html).toContain('value:42');
  });

  it('should work with Vue watch() integration', async () => {
    const source = signal(0);
    const scope = effectScope();
    const watchCallback = vi.fn();

    scope.run(() => {
      const ref = useSignalValue(source);
      watch(ref, (newVal) => {
        watchCallback(newVal);
      });
    });

    source.value = 10;
    await nextTick();
    expect(watchCallback).toHaveBeenCalledWith(10);

    source.value = 99;
    await nextTick();
    expect(watchCallback).toHaveBeenCalledWith(99);

    scope.stop();
  });

  it('should work with Vue computed() integration', () => {
    const source = signal(5);
    const scope = effectScope();

    scope.run(() => {
      const ref = useSignalValue(source);
      const label = vueComputed(() => `count=${ref.value}`);
      expect(label.value).toBe('count=5');

      source.value = 20;
      expect(label.value).toBe('count=20');
    });

    scope.stop();
  });
});
