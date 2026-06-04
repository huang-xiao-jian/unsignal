import { computed, signal } from '@preact/signals-core';
import { describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, type SetupContext } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Observer } from './Observer';

describe('Observer (SSR)', () => {
  it('should be defined as a component with name Observer', () => {
    expect(Observer.name).toBe('Observer');
  });

  it('should render default slot content', async () => {
    const Wrapper = defineComponent({
      components: { Observer },
      render: () => <Observer>{{ default: () => <p>hello world</p> }}</Observer>,
    });
    const app = createSSRApp(Wrapper);
    const html = await renderToString(app);
    expect(html).toContain('hello world');
  });

  it('should reflect current signal value in slot', async () => {
    const count = signal(0);
    const Wrapper = defineComponent({
      components: { Observer },
      render: () => <Observer>{{ default: () => <span>Count: {count.value}</span> }}</Observer>,
    });
    const app = createSSRApp(Wrapper);
    const html = await renderToString(app);
    expect(html).toContain('Count: 0');

    count.value = 100;
    const html2 = await renderToString(app);
    expect(html2).toContain('Count: 100');
  });

  it('should not crash when slot is empty', async () => {
    const Wrapper = defineComponent({
      components: { Observer },
      render: () => <Observer />,
    });
    const app = createSSRApp(Wrapper);
    const html = await renderToString(app);
    expect(typeof html).toBe('string');
  });

  it('should render signal value via effect tracking', async () => {
    const source = signal(42);
    const Wrapper = defineComponent({
      components: { Observer },
      render: () => <Observer>{{ default: () => `value=${source.value}` }}</Observer>,
    });
    const app = createSSRApp(Wrapper);
    const html = await renderToString(app);
    expect(html).toContain('value=42');
  });

  it('should support nested signal and computed usage', async () => {
    const count = signal(3);
    const doubled = computed(() => count.value * 2);
    const Wrapper = defineComponent({
      components: { Observer },
      render: () => (
        <Observer>
          {{
            default: () => (
              <p>
                {count.value} x 2 = {doubled.value}
              </p>
            ),
          }}
        </Observer>
      ),
    });
    const app = createSSRApp(Wrapper);
    const html = await renderToString(app);
    expect(html).toContain('3 x 2 = 6');
  });

  it('should expose setup that returns a render function', () => {
    const ctx = {
      attrs: {},
      slots: { default: () => <p>slot content</p> },
      emit: () => {},
      expose: () => {},
    } as unknown as SetupContext;

    const setupResult = Observer.setup!({}, ctx);
    expect(typeof setupResult).toBe('function');

    const vnode = (setupResult as () => unknown)();
    expect(vnode).toBeDefined();
  });
});
