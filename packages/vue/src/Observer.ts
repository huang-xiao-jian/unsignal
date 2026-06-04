import { effect } from '@preact/signals-core';
import { defineComponent, onScopeDispose, ref, type Ref } from 'vue';

export const Observer = defineComponent({
  name: 'Observer',
  setup(props, { slots }) {
    const tick: Ref<number> = ref(0);

    const dispose = effect(() => {
      // 在 effect 内调用 slot，使 signal.value 表达式被求值
      // effect 自动追踪这些 signal 作为依赖
      slots.default?.();
      // 递增 tick 触发 Observer 自身重渲染
      tick.value++;
    });
    onScopeDispose(dispose);

    return () => {
      // tick.value 在 render 中被读取，建立 Vue 响应式依赖
      // signal 变化 → effect 重跑 → tick++ → Vue 重渲染 → slot 重新求值
      void tick.value;
      return slots.default?.();
    };
  },
});
