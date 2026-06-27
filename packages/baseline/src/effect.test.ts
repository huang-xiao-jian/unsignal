import { describe, expect, it, vi } from 'vitest';
import { batch, computed, effect, signal } from './index';

describe('effect()', () => {
  it('should run the callback immediately', () => {
    const s = signal(123);
    const spy = vi.fn(() => {
      s.value;
    });
    effect(spy);
    expect(spy).toHaveBeenCalled();
  });

  it('should subscribe to signals', () => {
    const s = signal(123);
    const spy = vi.fn(() => {
      s.value;
    });
    effect(spy);
    spy.mockClear();

    s.value = 42;
    expect(spy).toHaveBeenCalled();
  });

  it('should subscribe to multiple signals', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value;
      b.value;
    });
    effect(spy);
    spy.mockClear();

    a.value = 'aa';
    b.value = 'bb';
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should dispose of subscriptions', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value + ' ' + b.value;
    });
    const handle = effect(spy);
    spy.mockClear();

    handle.dispose();
    expect(spy).not.toHaveBeenCalled();

    a.value = 'aa';
    b.value = 'bb';
    expect(spy).not.toHaveBeenCalled();
  });

  it('should dispose of subscriptions', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value + ' ' + b.value;
    });
    effect(function () {
      spy();
      if (a.value === 'aa') {
        this.dispose();
      }
    });

    expect(spy).toHaveBeenCalled();

    a.value = 'aa';
    expect(spy).toHaveBeenCalledTimes(2);

    a.value = 'aaa';
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should dispose of subscriptions immediately', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value + ' ' + b.value;
    });
    effect(function () {
      spy();
      this.dispose();
    });

    expect(spy).toHaveBeenCalledOnce();

    a.value = 'aa';
    expect(spy).toHaveBeenCalledOnce();

    a.value = 'aaa';
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should dispose of subscriptions when called twice', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value + ' ' + b.value;
    });
    const handle = effect(function () {
      spy();
      if (a.value === 'aa') {
        this.dispose();
      }
    });

    expect(spy).toHaveBeenCalled();

    a.value = 'aa';
    expect(spy).toHaveBeenCalledTimes(2);
    handle.dispose();

    a.value = 'aaa';
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should dispose of subscriptions immediately and signals are read after disposing', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value + ' ' + b.value;
    });
    effect(function () {
      this.dispose();
      spy();
    });

    expect(spy).toHaveBeenCalledOnce();

    a.value = 'aa';
    expect(spy).toHaveBeenCalledOnce();

    a.value = 'aaa';
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should dispose of subscriptions immediately when called twice (deferred)', () => {
    const a = signal('a');
    const b = signal('b');
    const spy = vi.fn(() => {
      a.value + ' ' + b.value;
    });
    const handle = effect(function () {
      spy();
      this.dispose();
    });

    expect(spy).toHaveBeenCalledOnce();

    a.value = 'aa';
    expect(spy).toHaveBeenCalledOnce();
    handle.dispose();

    a.value = 'aaa';
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should unsubscribe from signal', () => {
    const s = signal(123);
    const spy = vi.fn(() => {
      s.value;
    });
    const handle = effect(spy);
    spy.mockClear();

    handle.unsubscribe();
    s.value = 42;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should conditionally unsubscribe from signals', () => {
    const a = signal('a');
    const b = signal('b');
    const cond = signal(true);

    const spy = vi.fn(() => {
      cond.value ? a.value : b.value;
    });

    effect(spy);
    expect(spy).toHaveBeenCalledOnce();

    b.value = 'bb';
    expect(spy).toHaveBeenCalledOnce();

    cond.value = false;
    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockClear();

    a.value = 'aaa';
    expect(spy).not.toHaveBeenCalled();
  });

  it('should batch writes', () => {
    const a = signal('a');
    const spy = vi.fn(() => {
      a.value;
    });
    effect(spy);
    spy.mockClear();

    effect(() => {
      a.value = 'aa';
      a.value = 'aaa';
    });

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should call the cleanup callback before the next run', () => {
    const a = signal(0);
    const spy = vi.fn();

    effect(() => {
      a.value;
      return spy;
    });
    expect(spy).not.toHaveBeenCalled();
    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
    a.value = 2;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should call only the callback from the previous run', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const spy3 = vi.fn();
    const a = signal(spy1);

    effect(() => {
      return a.value;
    });

    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();

    a.value = spy2;
    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).not.toHaveBeenCalled();
    expect(spy3).not.toHaveBeenCalled();

    a.value = spy3;
    expect(spy1).toHaveBeenCalledOnce();
    expect(spy2).toHaveBeenCalledOnce();
    expect(spy3).not.toHaveBeenCalled();
  });

  it('should call the cleanup callback function when disposed', () => {
    const spy = vi.fn();

    const disposable = effect(() => {
      return spy;
    });
    expect(spy).not.toHaveBeenCalled();
    disposable.dispose();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should not recompute if the effect has been notified about changes, but no direct dependency has actually changed', () => {
    const s = signal(0);
    const c = computed(() => {
      s.value;
      return 0;
    });
    const spy = vi.fn(() => {
      c.value;
    });
    effect(spy);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    s.value = 1;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not recompute dependencies unnecessarily', () => {
    const spy = vi.fn();
    const a = signal(0);
    const b = signal(0);
    const c = computed(() => {
      b.value;
      spy();
    });
    effect(() => {
      if (a.value === 0) {
        c.value;
      }
    });
    expect(spy).toHaveBeenCalledOnce();

    batch(() => {
      b.value = 1;
      a.value = 1;
    });
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should not recompute dependencies out of order', () => {
    const a = signal(1);
    const b = signal(1);
    const c = signal(1);

    const spy = vi.fn(() => c.value);
    const d = computed(spy);

    effect(() => {
      if (a.value > 0) {
        b.value;
        d.value;
      } else {
        b.value;
      }
    });
    spy.mockClear();

    batch(() => {
      a.value = 2;
      b.value = 2;
      c.value = 2;
    });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    batch(() => {
      a.value = -1;
      b.value = -1;
      c.value = -1;
    });
    expect(spy).not.toHaveBeenCalled();
    spy.mockClear();
  });

  it('should recompute if a dependency changes during computation after becoming a dependency', () => {
    const a = signal(0);
    const spy = vi.fn(() => {
      if (a.value === 0) {
        a.value++;
      }
    });
    effect(spy);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should run the cleanup in an implicit batch', () => {
    const a = signal(0);
    const b = signal('a');
    const c = signal('b');
    const spy = vi.fn();

    effect(() => {
      b.value;
      c.value;
      spy(b.value + c.value);
    });

    effect(() => {
      a.value;
      return () => {
        b.value = 'x';
        c.value = 'y';
      };
    });

    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('xy');
  });

  it('should not retrigger the effect if the cleanup modifies one of the dependencies', () => {
    const a = signal(0);
    const spy = vi.fn();

    effect(() => {
      spy(a.value);
      return () => {
        a.value = 2;
      };
    });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(2);
  });

  it('should run the cleanup if the effect disposes itself', () => {
    const a = signal(0);
    const spy = vi.fn();

    const handle = effect(() => {
      if (a.value > 0) {
        handle.dispose();
        return spy;
      }
    });
    expect(spy).not.toHaveBeenCalled();
    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
    a.value = 2;
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should not run the effect if the cleanup function disposes it', () => {
    const a = signal(0);
    const spy = vi.fn();

    const handle = effect(() => {
      a.value;
      spy();
      return () => {
        handle.dispose();
      };
    });
    expect(spy).toHaveBeenCalledOnce();
    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should not subscribe to anything if first run throws', () => {
    const s = signal(0);
    const spy = vi.fn(() => {
      s.value;
      throw new Error('test');
    });
    expect(() => effect(spy)).to.throw('test');
    expect(spy).toHaveBeenCalledOnce();

    s.value++;
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should reset the cleanup if the effect throws', () => {
    const a = signal(0);
    const spy = vi.fn();

    effect(() => {
      if (a.value === 0) {
        return spy;
      } else {
        throw new Error('hello');
      }
    });
    expect(spy).not.toHaveBeenCalled();
    expect(() => (a.value = 1)).to.throw('hello');
    expect(spy).toHaveBeenCalledOnce();
    a.value = 0;
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should dispose the effect if the cleanup callback throws', () => {
    const a = signal(0);
    const spy = vi.fn();

    effect(() => {
      if (a.value === 0) {
        return () => {
          throw new Error('hello');
        };
      } else {
        spy();
      }
    });
    expect(spy).not.toHaveBeenCalled();
    expect(() => a.value++).to.throw('hello');
    expect(spy).not.toHaveBeenCalled();
    a.value++;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should run cleanups outside any evaluation context', () => {
    const spy = vi.fn();
    const a = signal(0);
    const b = signal(0);
    const c = computed(() => {
      if (a.value === 0) {
        effect(() => {
          return () => {
            b.value;
          };
        });
      }
      return a.value;
    });

    effect(() => {
      spy();
      c.value;
    });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    b.value = 1;
    expect(spy).not.toHaveBeenCalled();
  });

  it('should throw on cycles', () => {
    const a = signal(0);
    let i = 0;

    const fn = () =>
      effect(() => {
        // Prevent test suite from spinning if limit is not hit
        if (i++ > 200) {
          throw new Error('test failed');
        }
        a.value;
        a.value = NaN;
      });

    expect(fn).to.throw(/Cycle detected/);
  });

  it('should throw on indirect cycles', () => {
    const a = signal(0);
    let i = 0;

    const c = computed(() => {
      a.value;
      a.value = NaN;
      return NaN;
    });

    const fn = () =>
      effect(() => {
        // Prevent test suite from spinning if limit is not hit
        if (i++ > 200) {
          throw new Error('test failed');
        }
        c.value;
      });

    expect(fn).to.throw(/Cycle detected/);
  });

  it('should allow disposing the effect multiple times', () => {
    const disposable = effect(() => undefined);
    disposable.dispose();
    expect(() => disposable.dispose()).not.to.throw();
  });

  it('should support resource management disposal', () => {
    const a = signal(0);
    const spy = vi.fn();
    {
      using _dispose = effect(() => {
        a.value;
        return spy;
      });
    }
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should allow disposing a running effect', () => {
    const a = signal(0);
    const spy = vi.fn();
    const disposable = effect(() => {
      if (a.value === 1) {
        disposable.dispose();
        spy();
      }
    });
    expect(spy).not.toHaveBeenCalled();
    a.value = 1;
    expect(spy).toHaveBeenCalledOnce();
    a.value = 2;
    expect(spy).toHaveBeenCalledOnce();
  });

  it("should not run if it's first been triggered and then disposed in a batch", () => {
    const a = signal(0);
    const spy = vi.fn(() => {
      a.value;
    });
    const handle = effect(spy);
    spy.mockClear();

    batch(() => {
      a.value = 1;
      handle.dispose();
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("should not run if it's been triggered, disposed and then triggered again in a batch", () => {
    const a = signal(0);
    const spy = vi.fn(() => {
      a.value;
    });
    const handle = effect(spy);
    spy.mockClear();

    batch(() => {
      a.value = 1;
      handle.dispose();
      a.value = 2;
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not rerun an effect for a no-op batch assignment', () => {
    const foo = signal(42);
    const spy = vi.fn(() => {
      foo.value;
    });

    effect(spy);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    batch(() => {
      foo.value = 0;
      foo.value = 42;
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not rerun an effect for repeated no-op top-level batches', () => {
    const foo = signal(42);
    const spy = vi.fn(() => {
      foo.value;
    });

    effect(spy);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockClear();

    batch(() => {
      foo.value = 0;
      foo.value = 42;
    });
    expect(spy).not.toHaveBeenCalled();

    batch(() => {
      foo.value = -1;
      foo.value = 42;
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("should not rerun parent effect if a nested child effect's signal's value changes", () => {
    const parentSignal = signal(0);
    const childSignal = signal(0);

    const parentEffect = vi.fn(() => {
      parentSignal.value;
    });
    const childEffect = vi.fn(() => {
      childSignal.value;
    });

    effect(() => {
      parentEffect();
      effect(childEffect);
    });

    expect(parentEffect).toHaveBeenCalledOnce();
    expect(childEffect).toHaveBeenCalledOnce();

    childSignal.value = 1;

    expect(parentEffect).toHaveBeenCalledOnce();
    expect(childEffect).toHaveBeenCalledTimes(2);

    parentSignal.value = 1;

    expect(parentEffect).toHaveBeenCalledTimes(2);
    expect(childEffect).toHaveBeenCalledTimes(3);
  });

  // Test internal behavior depended on by Preact & React integrations
  describe('internals', () => {
    it("should pass in the effect instance in callback's `this`", () => {
      let e: any;
      effect(function (this: any) {
        e = this;
      });
      expect(typeof e._start).to.equal('function');
      expect(typeof e._dispose).to.equal('function');
    });

    it('should allow setting _callback that replaces the default functionality', () => {
      const a = signal(0);
      const oldSpy = vi.fn();
      const newSpy = vi.fn();

      let e: any;
      effect(function (this: any) {
        e = this;
        a.value;
        oldSpy();
      });
      oldSpy.mockClear();

      e._callback = newSpy;
      a.value = 1;

      expect(oldSpy).not.toHaveBeenCalled();
      expect(newSpy).toHaveBeenCalled();
    });

    it('should return a function for closing the effect scope from _start', () => {
      const s = signal(0);

      let e: any;
      effect(function (this: any) {
        e = this;
      });

      const spy = vi.fn();
      e._callback = spy;

      const done1 = e._start();
      s.value;
      done1();
      expect(spy).not.toHaveBeenCalled();

      s.value = 2;
      expect(spy).toHaveBeenCalled();
      spy.mockClear();

      const done2 = e._start();
      done2();

      s.value = 3;
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw on out-of-order start1-start2-end1 sequences', () => {
      let e1: any;
      effect(function (this: any) {
        e1 = this;
      });

      let e2: any;
      effect(function (this: any) {
        e2 = this;
      });

      const done1 = e1._start();
      const done2 = e2._start();
      try {
        expect(() => done1()).to.throw(/Out-of-order/);
      } finally {
        done2();
        done1();
      }
    });

    it('should throw a cycle detection error when _start is called while the effect is running', () => {
      let e: any;
      effect(function (this: any) {
        e = this;
      });

      const done = e._start();
      try {
        expect(() => e._start()).to.throw(/Cycle detected/);
      } finally {
        done();
      }
    });

    it('should dispose the effect on _dispose', () => {
      const s = signal(0);

      let e: any;
      effect(function (this: any) {
        e = this;
      });

      const spy = vi.fn();
      e._callback = spy;

      const done = e._start();
      try {
        s.value;
      } finally {
        done();
      }
      expect(spy).not.toHaveBeenCalled();

      s.value = 2;
      expect(spy).toHaveBeenCalled();
      spy.mockClear();

      e._dispose();
      s.value = 3;
      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow reusing the effect after disposing it', () => {
      const s = signal(0);

      let e: any;
      effect(function (this: any) {
        e = this;
      });

      const spy = vi.fn();
      e._callback = spy;
      e._dispose();

      const done = e._start();
      try {
        s.value;
      } finally {
        done();
      }
      s.value = 2;
      expect(spy).toHaveBeenCalled();
    });

    it('should have property _sources that is undefined when and only when the effect has no sources', () => {
      const s = signal(0);

      let e: any;
      effect(function (this: any) {
        e = this;
      });
      expect(e._sources).to.be.undefined;

      const done1 = e._start();
      try {
        s.value;
      } finally {
        done1();
      }
      expect(e._sources).not.to.be.undefined;

      const done2 = e._start();
      done2();
      expect(e._sources).to.be.undefined;

      const done3 = e._start();
      try {
        s.value;
      } finally {
        done3();
      }
      expect(e._sources).not.to.be.undefined;

      e._dispose();
      expect(e._sources).to.be.undefined;
    });
  });
});
