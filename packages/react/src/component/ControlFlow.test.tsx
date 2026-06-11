import { signal, type ReadonlySignal } from '@preact/signals-core';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { For } from './For';
import { Show } from './Show';
import { Switch } from './Switch';

afterEach(() => {
  cleanup();
});

describe('Show', () => {
  it('should render children when condition is true and fallback when false', async () => {
    const visible = signal(false);

    render(
      <Show when={visible} fallback={<span>hidden</span>}>
        {() => <span>visible</span>}
      </Show>
    );
    expect(screen.getByText('hidden')).toBeDefined();

    await act(async () => {
      visible.value = true;
    });
    expect(screen.getByText('visible')).toBeDefined();

    await act(async () => {
      visible.value = false;
    });
    expect(screen.getByText('hidden')).toBeDefined();
  });

  it('should track signals inside the active branch', async () => {
    const visible = signal(true);
    const label = signal('A');

    render(<Show when={visible}>{() => <span>label:{label.value}</span>}</Show>);
    expect(screen.getByText('label:A')).toBeDefined();

    await act(async () => {
      label.value = 'B';
    });
    expect(screen.getByText('label:B')).toBeDefined();
  });

  it('should not re-read the condition when only the active branch signal changes', async () => {
    const visible = signal(true);
    const label = signal('A');
    let conditionReads = 0;
    const when = {
      get value() {
        conditionReads += 1;
        return visible.value;
      },
      peek: () => visible.peek(),
      subscribe: visible.subscribe.bind(visible),
    } as unknown as ReadonlySignal<boolean>;

    render(<Show when={when}>{() => <span>label:{label.value}</span>}</Show>);
    const initialConditionReads = conditionReads;

    await act(async () => {
      label.value = 'B';
    });

    expect(screen.getByText('label:B')).toBeDefined();
    expect(conditionReads).toBe(initialConditionReads);
  });
});

describe('For', () => {
  it('should render fallback for empty arrays and rows for items', async () => {
    const items = signal<string[]>([]);

    render(
      <ul>
        <For each={items} fallback={<li>empty</li>}>
          {(item) => <li>{item}</li>}
        </For>
      </ul>
    );
    expect(screen.getByText('empty')).toBeDefined();

    await act(async () => {
      items.value = ['A', 'B'];
    });
    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
  });

  it('should preserve keyed rows when inserting items', async () => {
    interface Item {
      id: number;
      label: string;
    }

    const items = signal<Item[]>([
      { id: 1, label: 'A' },
      { id: 2, label: 'B' },
    ]);
    const rowRenderCount = vi.fn();

    render(
      <ul>
        <For each={items} by={(item) => item.id}>
          {(item) => {
            rowRenderCount(item.id);
            return <li>{item.label}</li>;
          }}
        </For>
      </ul>
    );
    rowRenderCount.mockClear();

    await act(async () => {
      items.value = [{ id: 0, label: 'Z' }, ...items.value];
    });

    expect(screen.getByText('Z')).toBeDefined();
    expect(screen.getByText('A')).toBeDefined();
    expect(screen.getByText('B')).toBeDefined();
  });

  it('should only re-render the row that reads a changed row signal', async () => {
    interface Item {
      id: number;
      label: ReadonlySignal<string>;
    }

    const first = signal('A');
    const second = signal('B');
    const third = signal('C');
    const items = signal<Item[]>([
      { id: 1, label: first },
      { id: 2, label: second },
      { id: 3, label: third },
    ]);
    const rowRenderCount = vi.fn();

    render(
      <ul>
        <For each={items} by={(item) => item.id}>
          {(item) => {
            rowRenderCount(item.id);
            return <li>{item.label.value}</li>;
          }}
        </For>
      </ul>
    );
    rowRenderCount.mockClear();

    await act(async () => {
      second.value = 'B2';
    });

    expect(screen.getByText('B2')).toBeDefined();
    expect(rowRenderCount).toHaveBeenCalledWith(2);
    expect(rowRenderCount).not.toHaveBeenCalledWith(1);
    expect(rowRenderCount).not.toHaveBeenCalledWith(3);
  });
});

describe('Switch', () => {
  it('should render the first matching case and default fallback', async () => {
    const status = signal<'loading' | 'success' | 'error'>('loading');

    render(
      <Switch when={status}>
        <Switch.Case is="loading">
          <span>loading</span>
        </Switch.Case>
        <Switch.Case is="success">{() => <span>success</span>}</Switch.Case>
        <Switch.Default>{(value) => <span>unknown:{String(value)}</span>}</Switch.Default>
      </Switch>
    );
    expect(screen.getByText('loading')).toBeDefined();

    await act(async () => {
      status.value = 'success';
    });
    expect(screen.getByText('success')).toBeDefined();

    await act(async () => {
      status.value = 'error';
    });
    expect(screen.getByText('unknown:error')).toBeDefined();
  });

  it('should support custom equality', () => {
    interface User {
      id: number;
      role: string;
    }

    const currentUser = signal<User>({ id: 1, role: 'admin' });

    render(
      <Switch when={currentUser} equal={(a, b) => a.role === b.role}>
        <Switch.Case is={{ id: 0, role: 'admin' }}>
          {(user) => <span>admin:{user.id}</span>}
        </Switch.Case>
      </Switch>
    );

    expect(screen.getByText('admin:1')).toBeDefined();
  });

  it('should not re-read the switch value when only the active branch signal changes', async () => {
    const status = signal<'success'>('success');
    const label = signal('A');
    let switchValueReads = 0;
    const when = {
      get value() {
        switchValueReads += 1;
        return status.value;
      },
      peek: () => status.peek(),
      subscribe: status.subscribe.bind(status),
    } as unknown as ReadonlySignal<'success'>;

    render(
      <Switch when={when}>
        <Switch.Case is="success">{() => <span>label:{label.value}</span>}</Switch.Case>
      </Switch>
    );
    const initialSwitchValueReads = switchValueReads;

    await act(async () => {
      label.value = 'B';
    });

    expect(screen.getByText('label:B')).toBeDefined();
    expect(switchValueReads).toBe(initialSwitchValueReads);
  });
});
