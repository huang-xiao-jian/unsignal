import { signal, type ReadonlySignal } from '@unsignal/baseline';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { Aborter, Resource, ResourceLoaderParams, ResourceStatus } from './resource';
import { ResourceParamsInterpreter, ResourceTask, ResourceTaskRunner, resource } from './resource';

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('resource', () => {
  describe('ResourceParamsInterpreter', () => {
    it('should interpret params from a signal source', () => {
      const params = signal<number | undefined>(1);
      const interpreter = new ResourceParamsInterpreter(params);

      expect(interpreter.interpret()).toBe(1);

      params.value = 2;
      expect(interpreter.interpret()).toBe(2);
    });

    it('should interpret params from a getter source', () => {
      const params = signal<number | undefined>(1);
      const interpreter = new ResourceParamsInterpreter(() => params.value);

      expect(interpreter.interpret()).toBe(1);

      params.value = 2;
      expect(interpreter.interpret()).toBe(2);
    });
  });

  describe('ResourceTask', () => {
    it('should execute the loader with params and previous status', async () => {
      const loader = vi.fn(async ({ params, previous }: ResourceLoaderParams<number>) => {
        expect(params).toBe(1);
        expect(previous.status).toBe('idle');
        return 'Ada';
      });

      const task = new ResourceTask<number, string>(1);

      await expect(task.run({ params: 1, previousStatus: 'idle', loader })).resolves.toBe('Ada');
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should abort and run cleanup only once', () => {
      const cleanup = vi.fn();
      let capturedAborter!: Aborter;
      const task = new ResourceTask<number, string>(1);

      void task.run({
        params: 1,
        previousStatus: 'idle',
        loader: ({ aborter }) =>
          new Promise<string>(() => {
            capturedAborter = aborter;
            aborter.onAbort(cleanup);
          }),
      });

      expect(capturedAborter.signal.aborted).toBe(false);

      task.abort();
      task.abort();

      expect(capturedAborter.signal.aborted).toBe(true);
      expect(cleanup).toHaveBeenCalledTimes(1);

      capturedAborter.onAbort(cleanup);
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('ResourceTaskRunner', () => {
    it('should execute a new task and notify the resolved callback', async () => {
      const onResolved = vi.fn();
      const onRejected = vi.fn();
      const runner = new ResourceTaskRunner<number, string>(async ({ params, previous }) => {
        expect(params).toBe(1);
        expect(previous.status).toBe('idle');
        return 'Ada';
      });

      runner.execute(
        { params: 1, previousStatus: 'idle' },
        {
          onResolved,
          onRejected,
        }
      );

      await flushPromises();

      expect(onResolved).toHaveBeenCalledWith('Ada');
      expect(onRejected).not.toHaveBeenCalled();
    });

    it('should replace the previous task when executing again', async () => {
      const cleanup = vi.fn();
      const onResolved = vi.fn();
      const onRejected = vi.fn();
      const runner = new ResourceTaskRunner<number, string>(
        ({ aborter }) =>
          new Promise<string>(() => {
            aborter.onAbort(cleanup);
          })
      );

      runner.execute(
        { params: 1, previousStatus: 'idle' },
        {
          onResolved,
          onRejected,
        }
      );
      runner.execute(
        { params: 2, previousStatus: 'loading' },
        {
          onResolved,
          onRejected,
        }
      );
      await flushPromises();

      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(onResolved).not.toHaveBeenCalled();
      expect(onRejected).not.toHaveBeenCalled();
    });

    it('should abort the active run when abort is called', () => {
      const cleanup = vi.fn();
      const runner = new ResourceTaskRunner<number, string>(
        ({ aborter }) =>
          new Promise<string>(() => {
            aborter.onAbort(cleanup);
          })
      );

      runner.execute(
        { params: 1, previousStatus: 'idle' },
        {
          onResolved: vi.fn(),
          onRejected: vi.fn(),
        }
      );

      runner.abort();
      runner.abort();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  it('should stay idle when params is undefined', () => {
    const params = signal<number | undefined>(undefined);
    const loader = vi.fn();

    const userResource = resource({
      params,
      loader,
    });

    expect(userResource.status.value).toBe('idle');
    expect(userResource.value.value).toBeUndefined();
    expect(userResource.error.value).toBeUndefined();
    expect(userResource.isLoading.value).toBe(false);
    expect(userResource.hasValue()).toBe(false);
    expect(loader).not.toHaveBeenCalled();
  });

  it('should start loading immediately when params is defined', () => {
    const params = signal<number | undefined>(1);
    const deferred = createDeferred<string>();

    const userResource = resource({
      params,
      loader: () => deferred.promise,
    });

    expect(userResource.status.value).toBe('loading');
    expect(userResource.isLoading.value).toBe(true);
    expect(userResource.value.value).toBeUndefined();
    expect(userResource.error.value).toBeUndefined();
    expect(userResource.hasValue()).toBe(false);
  });

  it('should resolve the active run and expose a value', async () => {
    const params = signal<number | undefined>(1);
    const deferred = createDeferred<string>();

    const userResource = resource({
      params,
      loader: () => deferred.promise,
    });

    deferred.resolve('Ada');
    await flushPromises();

    expect(userResource.status.value).toBe('resolved');
    expect(userResource.isLoading.value).toBe(false);
    expect(userResource.value.value).toBe('Ada');
    expect(userResource.error.value).toBeUndefined();
    expect(userResource.hasValue()).toBe(true);
  });

  it('should reject the active run and expose the error', async () => {
    const params = signal<number | undefined>(1);
    const deferred = createDeferred<string>();
    const failure = new Error('request failed');

    const userResource = resource({
      params,
      loader: () => deferred.promise,
    });

    deferred.reject(failure);
    await flushPromises();

    expect(userResource.status.value).toBe('error');
    expect(userResource.isLoading.value).toBe(false);
    expect(userResource.value.value).toBeUndefined();
    expect(userResource.error.value).toBe(failure);
    expect(userResource.hasValue()).toBe(false);
  });

  it('should restore defaultValue when params becomes undefined', async () => {
    const params = signal<number | undefined>(1);
    const deferred = createDeferred<string>();

    const userResource = resource({
      params,
      defaultValue: 'Guest',
      loader: () => deferred.promise,
    });

    deferred.resolve('Ada');
    await flushPromises();

    params.value = undefined;

    expect(userResource.status.value).toBe('idle');
    expect(userResource.isLoading.value).toBe(false);
    expect(userResource.value.value).toBe('Guest');
    expect(userResource.error.value).toBeUndefined();
    expect(userResource.hasValue()).toBe(true);
  });

  it('should use reloading when a retained value exists', async () => {
    const params = signal<number | undefined>(1);
    const firstRun = createDeferred<string>();
    const secondRun = createDeferred<string>();
    let runCount = 0;

    const userResource = resource({
      params,
      loader: () => {
        runCount += 1;
        return runCount === 1 ? firstRun.promise : secondRun.promise;
      },
    });

    firstRun.resolve('Ada');
    await flushPromises();

    params.value = 2;

    expect(userResource.status.value).toBe('reloading');
    expect(userResource.isLoading.value).toBe(true);
    expect(userResource.value.value).toBe('Ada');
    expect(userResource.error.value).toBeUndefined();

    secondRun.resolve('Grace');
    await flushPromises();

    expect(userResource.status.value).toBe('resolved');
    expect(userResource.value.value).toBe('Grace');
  });

  it('should clear error and use loading after an error with no retained value', async () => {
    const params = signal<number | undefined>(1);
    const firstRun = createDeferred<string>();
    const secondRun = createDeferred<string>();
    const failure = new Error('request failed');
    let runCount = 0;

    const userResource = resource({
      params,
      loader: () => {
        runCount += 1;
        return runCount === 1 ? firstRun.promise : secondRun.promise;
      },
    });

    firstRun.reject(failure);
    await flushPromises();

    params.value = 2;

    expect(userResource.status.value).toBe('loading');
    expect(userResource.value.value).toBeUndefined();
    expect(userResource.error.value).toBeUndefined();

    secondRun.resolve('Grace');
    await flushPromises();

    expect(userResource.status.value).toBe('resolved');
    expect(userResource.value.value).toBe('Grace');
  });

  it('should keep the retained value when reload is triggered', async () => {
    const params = signal<number | undefined>(1);
    const firstRun = createDeferred<string>();
    const secondRun = createDeferred<string>();
    let runCount = 0;

    const userResource = resource({
      params,
      loader: () => {
        runCount += 1;
        return runCount === 1 ? firstRun.promise : secondRun.promise;
      },
    });

    firstRun.resolve('Ada');
    await flushPromises();

    expect(userResource.reload()).toBe(true);
    expect(userResource.status.value).toBe('reloading');
    expect(userResource.value.value).toBe('Ada');

    secondRun.resolve('Grace');
    await flushPromises();

    expect(userResource.status.value).toBe('resolved');
    expect(userResource.value.value).toBe('Grace');
  });

  it('should return false from reload when params is undefined', () => {
    const params = signal<number | undefined>(undefined);

    const userResource = resource({
      params,
      loader: async () => 'Ada',
    });

    expect(userResource.reload()).toBe(false);
    expect(userResource.status.value).toBe('idle');
  });

  it('should ignore stale resolves from aborted runs', async () => {
    const params = signal<number | undefined>(1);
    const firstRun = createDeferred<string>();
    const secondRun = createDeferred<string>();
    let runCount = 0;

    const userResource = resource({
      params,
      loader: () => {
        runCount += 1;
        return runCount === 1 ? firstRun.promise : secondRun.promise;
      },
    });

    params.value = 2;
    secondRun.resolve('Grace');
    firstRun.resolve('Ada');
    await flushPromises();

    expect(userResource.status.value).toBe('resolved');
    expect(userResource.value.value).toBe('Grace');
    expect(userResource.error.value).toBeUndefined();
  });

  it('should ignore stale rejections from aborted runs', async () => {
    const params = signal<number | undefined>(1);
    const firstRun = createDeferred<string>();
    const secondRun = createDeferred<string>();
    const staleError = new Error('stale failure');
    let runCount = 0;

    const userResource = resource({
      params,
      loader: () => {
        runCount += 1;
        return runCount === 1 ? firstRun.promise : secondRun.promise;
      },
    });

    params.value = 2;
    secondRun.resolve('Grace');
    firstRun.reject(staleError);
    await flushPromises();

    expect(userResource.status.value).toBe('resolved');
    expect(userResource.value.value).toBe('Grace');
    expect(userResource.error.value).toBeUndefined();
  });

  it('should abort the previous run before starting a new one', () => {
    const params = signal<number | undefined>(1);
    const abortedSignals: boolean[] = [];

    resource({
      params,
      loader: ({ aborter }) =>
        new Promise<string>(() => {
          abortedSignals.push(aborter.signal.aborted);
        }),
    });

    params.value = 2;

    expect(abortedSignals).toEqual([false, false]);
  });

  it('should trigger AbortSignal and onAbort cleanups when a run is replaced', () => {
    const params = signal<number | undefined>(1);
    const cleanup = vi.fn();
    const aborted: boolean[] = [];

    resource({
      params,
      loader: ({ aborter }) =>
        new Promise<string>(() => {
          aborted.push(aborter.signal.aborted);
          aborter.onAbort(() => {
            aborted.push(aborter.signal.aborted);
            cleanup();
          });
        }),
    });

    params.value = 2;

    expect(aborted).toEqual([false, true, false]);
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('should ignore onAbort registration after a run is already aborted', () => {
    const params = signal<number | undefined>(1);
    let firstAborter!: Aborter;
    const cleanup = vi.fn();

    resource({
      params,
      loader: ({ aborter }) => {
        if (!firstAborter) {
          firstAborter = aborter;
        }
        return new Promise<string>(() => {});
      },
    });

    params.value = 2;
    firstAborter.onAbort(cleanup);

    expect(cleanup).not.toHaveBeenCalled();
  });

  it('should abort the active run and stop tracking on destroy', async () => {
    const params = signal<number | undefined>(1);
    const cleanup = vi.fn();
    const deferred = createDeferred<string>();
    const userResource = resource({
      params,
      loader: ({ aborter }) => {
        aborter.onAbort(cleanup);
        return deferred.promise;
      },
    });

    userResource.destroy();
    params.value = 2;
    deferred.resolve('Ada');
    await flushPromises();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(userResource.status.value).toBe('loading');
    expect(userResource.value.value).toBeUndefined();
    expect(userResource.error.value).toBeUndefined();
  });

  it('should pass previous status into the loader', async () => {
    const params = signal<number | undefined>(1);
    const firstRun = createDeferred<string>();
    const secondRun = createDeferred<string>();
    const seenStatuses: ResourceStatus[] = [];
    let runCount = 0;

    const userResource = resource({
      params,
      loader: ({ previous }) => {
        seenStatuses.push(previous.status);
        runCount += 1;
        return runCount === 1 ? firstRun.promise : secondRun.promise;
      },
    });

    firstRun.resolve('Ada');
    await flushPromises();
    userResource.reload();

    expect(seenStatuses).toEqual(['idle', 'resolved']);

    secondRun.resolve('Grace');
    await flushPromises();
  });

  it('should support getter params with reactive tracking', async () => {
    const source = signal<number | undefined>(1);
    const deferred = createDeferred<string>();
    const loader = vi.fn(() => deferred.promise);

    const userResource = resource({
      params: () => source.value,
      loader,
    });

    expect(loader).toHaveBeenCalledTimes(1);
    expect(userResource.status.value).toBe('loading');

    source.value = 2;
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('should expose the expected loader params shape', () => {
    const params = signal<number | undefined>(1);

    resource({
      params,
      loader: (loaderParams) => {
        expectTypeOf(loaderParams).toEqualTypeOf<ResourceLoaderParams<number>>();
        expectTypeOf(loaderParams.aborter.signal).toEqualTypeOf<AbortSignal>();
        expectTypeOf(loaderParams.previous.status).toEqualTypeOf<ResourceStatus>();
        return Promise.resolve('Ada');
      },
    });
  });

  it('should return Resource<TValue> when defaultValue is provided', () => {
    const params = signal<number | undefined>(1);

    const userResource = resource({
      params,
      defaultValue: 'Guest',
      loader: async () => 'Ada',
    });

    expectTypeOf(userResource).toEqualTypeOf<Resource<string>>();
    expectTypeOf(userResource.value).toEqualTypeOf<ReadonlySignal<string>>();
  });

  it('should return Resource<TValue | undefined> when defaultValue is omitted', () => {
    const params = signal<number | undefined>(1);

    const userResource = resource({
      params,
      loader: async () => 'Ada',
    });

    expectTypeOf(userResource).toEqualTypeOf<Resource<string | undefined>>();
    expectTypeOf(userResource.value).toEqualTypeOf<ReadonlySignal<string | undefined>>();
  });
});
