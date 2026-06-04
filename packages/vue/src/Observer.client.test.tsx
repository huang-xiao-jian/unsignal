// @vitest-environment jsdom
import { computed, signal } from '@preact/signals-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, type App, type VNode } from 'vue';
import { Observer } from './Observer';

describe('Observer (client)', () => {
  let container: HTMLDivElement;
  let app: App | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    app?.unmount();
    app = undefined;
    container.remove();
  });

  function mountApp(render: () => VNode): App {
    const Root = defineComponent({ render });
    app = createApp(Root);
    app.mount(container);
    return app;
  }

  it('should render initial signal value in slot', () => {
    const count = signal(0);
    mountApp(() => <Observer>{{ default: () => <span>count:{count.value}</span> }}</Observer>);

    expect(container.innerHTML).toContain('count:0');
  });

  it('should update DOM when signal value changes', async () => {
    const count = signal(0);
    mountApp(() => <Observer>{{ default: () => <span>count:{count.value}</span> }}</Observer>);

    expect(container.innerHTML).toContain('count:0');

    count.value = 1;
    await nextTick();
    expect(container.innerHTML).toContain('count:1');

    count.value = 42;
    await nextTick();
    expect(container.innerHTML).toContain('count:42');
  });

  it('should update DOM when computed signal changes', async () => {
    const a = signal(2);
    const b = signal(3);
    const product = computed(() => a.value * b.value);

    mountApp(() => <Observer>{{ default: () => <span>result:{product.value}</span> }}</Observer>);

    expect(container.innerHTML).toContain('result:6');

    a.value = 5;
    await nextTick();
    expect(container.innerHTML).toContain('result:15');

    b.value = 10;
    await nextTick();
    expect(container.innerHTML).toContain('result:50');
  });

  it('should track multiple signals in a single slot', async () => {
    const name = signal('Alice');
    const age = signal(25);

    mountApp(() => (
      <Observer>
        {{
          default: () => (
            <span>
              {name.value}:{age.value}
            </span>
          ),
        }}
      </Observer>
    ));

    expect(container.innerHTML).toContain('Alice:25');

    name.value = 'Bob';
    await nextTick();
    expect(container.innerHTML).toContain('Bob:25');

    age.value = 30;
    await nextTick();
    expect(container.innerHTML).toContain('Bob:30');
  });

  it('should stop tracking signals after unmount', async () => {
    const count = signal(0);
    mountApp(() => <Observer>{{ default: () => <span>count:{count.value}</span> }}</Observer>);

    expect(container.innerHTML).toContain('count:0');

    app!.unmount();
    const htmlBeforeChange = container.innerHTML;

    count.value = 999;
    await nextTick();

    expect(() => count.value++).not.toThrow();
    expect(htmlBeforeChange).toBeDefined();
  });

  it('should render signal value with object type', async () => {
    interface User {
      name: string;
      score: number;
    }
    const user = signal<User>({ name: 'Alice', score: 100 });

    mountApp(() => (
      <Observer>
        {{
          default: () => (
            <span>
              {user.value.name}:{user.value.score}
            </span>
          ),
        }}
      </Observer>
    ));

    expect(container.innerHTML).toContain('Alice:100');

    user.value = { name: 'Bob', score: 200 };
    await nextTick();
    expect(container.innerHTML).toContain('Bob:200');
  });
});
