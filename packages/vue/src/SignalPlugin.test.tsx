import { describe, expect, it } from 'vitest';
import { Observer } from './Observer';
import { SignalPlugin } from './SignalPlugin';

describe('SignalPlugin', () => {
  it('should expose a Plugin object with install method', () => {
    expect(SignalPlugin).toBeDefined();
    expect(typeof SignalPlugin.install).toBe('function');
  });

  it('should register Observer component globally on install', () => {
    const calls: Array<[string, unknown]> = [];
    const fakeApp = {
      component: (name: string, comp: unknown) => {
        calls.push([name, comp]);
        return fakeApp;
      },
    };

    SignalPlugin.install!(fakeApp as never);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe('Observer');
  });

  it('should register the same Observer instance used by direct import', () => {
    const calls: Array<[string, unknown]> = [];
    const fakeApp = {
      component: (name: string, comp: unknown) => {
        calls.push([name, comp]);
        return fakeApp;
      },
    };

    SignalPlugin.install!(fakeApp as never);

    const registered = calls[0]?.[1];
    expect(registered).toBe(Observer);
  });

  it('should be consumable via app.use(SignalPlugin) - install invoked once', () => {
    const calls: Array<[string, unknown]> = [];
    const fakeApp: {
      component: (name: string, comp: unknown) => typeof fakeApp;
      use: (plugin: unknown, ...options: unknown[]) => typeof fakeApp;
    } = {
      component: (name: string, comp: unknown) => {
        calls.push([name, comp]);
        return fakeApp;
      },
      // 模拟 app.use(plugin) 内部调用 plugin.install(app, ...options)
      use: (plugin: unknown, ..._options: unknown[]) => {
        const p = plugin as { install?: (app: unknown, ...opts: unknown[]) => unknown };
        p.install?.(fakeApp);
        return fakeApp;
      },
    };

    fakeApp.use(SignalPlugin);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe('Observer');
    expect(calls[0]?.[1]).toBe(Observer);
  });
});
