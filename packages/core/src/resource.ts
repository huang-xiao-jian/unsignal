import { computed, effect, signal, untracked, type ReadonlySignal } from '@preact/signals-core';

export type ResourceStatus = 'idle' | 'loading' | 'reloading' | 'resolved' | 'error';

export interface Aborter {
  readonly signal: AbortSignal;
  onAbort(cleanupFn: () => void): void;
}

export interface ResourcePrevious {
  readonly status: ResourceStatus;
}

export interface ResourceLoaderParams<TParams> {
  readonly params: TParams;
  readonly aborter: Aborter;
  readonly previous: ResourcePrevious;
}

export type ResourceLoader<TParams, TValue> = (
  params: ResourceLoaderParams<TParams>
) => Promise<TValue>;

export type ResourceParams<TParams> =
  | ReadonlySignal<TParams | undefined>
  | (() => TParams | undefined);

export interface ResourceOptions<TParams, TValue> {
  params: ResourceParams<TParams>;
  loader: ResourceLoader<TParams, TValue>;
  defaultValue?: TValue;
}

export interface Resource<T> {
  readonly value: ReadonlySignal<T>;
  readonly status: ReadonlySignal<ResourceStatus>;
  readonly error: ReadonlySignal<unknown | undefined>;
  readonly isLoading: ReadonlySignal<boolean>;
  hasValue(this: T extends undefined ? this : never): this is Resource<Exclude<T, undefined>>;
  hasValue(): boolean;
  reload(): boolean;
  destroy(): void;
}

export class ResourceParamsInterpreter<TParams> {
  private readonly params;

  public constructor(params: ResourceParams<TParams>) {
    this.params = params;
  }

  public interpret(): TParams | undefined {
    if (typeof this.params === 'function') {
      return this.params();
    }

    return this.params.value;
  }
}

interface ResourceTaskRunOptions<TParams, TValue> {
  params: TParams;
  previousStatus: ResourceStatus;
  loader: ResourceLoader<TParams, TValue>;
}

type CleanupFn = () => void;

export class ResourceTaskAborter implements Aborter {
  public readonly signal: AbortSignal;

  private readonly abortController: AbortController;

  private readonly cleanups: Set<CleanupFn>;

  public constructor() {
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.cleanups = new Set<CleanupFn>();
  }

  public abort() {
    this.abortController.abort();

    for (const cleanup of this.cleanups) {
      cleanup();
    }

    this.cleanups.clear();
  }

  public onAbort(cleanupFn: () => void) {
    this.cleanups.add(cleanupFn);
  }
}

export class ResourceTask<TParams, TValue> {
  private aborted = false;

  private readonly aborter: ResourceTaskAborter;

  public constructor(public readonly id: number) {
    this.aborter = new ResourceTaskAborter();
  }

  public run(options: ResourceTaskRunOptions<TParams, TValue>): Promise<TValue> {
    return options.loader({
      params: options.params,
      previous: {
        status: options.previousStatus,
      },
      aborter: this.aborter,
    });
  }

  public abort(): void {
    if (this.aborted) {
      return;
    }

    this.aborted = true;
    this.aborter.abort();
  }
}

interface ResourceTaskRunnerExecuteCallbacks<TParams, TValue> {
  onResolved: (value: TValue) => void;
  onRejected: (error: unknown) => void;
}

type ResourceTaskExecuteOptions<TParams, TValue> = Pick<
  ResourceTaskRunOptions<TParams, TValue>,
  'params' | 'previousStatus'
>;

export class ResourceTaskRunner<TParams, TValue> {
  private nextRunId = 0;
  private activity: ResourceTask<TParams, TValue> | undefined;

  public constructor(private readonly loader: ResourceLoader<TParams, TValue>) {}

  public execute(
    options: ResourceTaskExecuteOptions<TParams, TValue>,
    callbacks: ResourceTaskRunnerExecuteCallbacks<TParams, TValue>
  ): void {
    // Abort the previous run if it exists
    this.abort();

    // Generate a unique ID for this run
    const id = ++this.nextRunId;
    const receipt: ResourceTaskRunOptions<TParams, TValue> = {
      loader: this.loader,
      params: options.params,
      previousStatus: options.previousStatus,
    };

    // Create a new task and run it
    this.activity = new ResourceTask<TParams, TValue>(id);
    this.activity.run(receipt).then(
      (value) => {
        if (this.activity?.id === id) {
          callbacks.onResolved(value);
        }
      },
      (error: unknown) => {
        if (this.activity?.id === id) {
          callbacks.onRejected(error);
        }
      }
    );
  }

  public abort(): void {
    this.activity?.abort();
    this.activity = undefined;
  }
}

class ResourceController<TParams, TValue> implements Resource<TValue | undefined> {
  public readonly value;
  public readonly status;
  public readonly error;
  public readonly isLoading;

  private readonly defaultValue;
  private readonly paramsInterpreter;
  private readonly taskRunner;
  private readonly stopTracking;
  private readonly value$;
  private readonly status$;
  private readonly error$;
  private currentParams: TParams | undefined;
  private destroyed = false;

  public constructor(options: ResourceOptions<TParams, TValue>) {
    this.defaultValue = options.defaultValue;
    this.paramsInterpreter = new ResourceParamsInterpreter(options.params);
    this.taskRunner = new ResourceTaskRunner(options.loader);

    this.value$ = signal<TValue | undefined>(options.defaultValue);
    this.status$ = signal<ResourceStatus>('idle');
    this.error$ = signal<unknown | undefined>(undefined);

    this.value = this.value$;
    this.status = this.status$;
    this.error = this.error$;
    this.isLoading = computed(
      () => this.status$.value === 'loading' || this.status$.value === 'reloading'
    );

    this.stopTracking = effect(() => {
      const nextParams = this.paramsInterpreter.interpret();
      untracked(() => {
        this.handleParamsChange(nextParams);
      });
    });
  }

  public hasValue(this: Resource<TValue | undefined>): this is Resource<Exclude<TValue, undefined>>;
  public hasValue(): boolean;
  public hasValue(): boolean {
    return this.value$.value !== undefined;
  }

  public reload(): boolean {
    if (this.currentParams === undefined || this.destroyed) {
      return false;
    }

    this.startRun(this.currentParams);
    return true;
  }

  public destroy(): void {
    this.runInActivity(() => {
      this.destroyed = true;
      this.stopTracking();
      this.stopRunning();
    });
  }

  private handleParamsChange(nextParams: TParams | undefined): void {
    this.currentParams = nextParams;

    if (nextParams === undefined) {
      this.stopRunning();
      this.value$.value = this.defaultValue;
      this.status$.value = 'idle';
      this.error$.value = undefined;
      return;
    }

    this.startRun(nextParams);
  }

  private startRun(params: TParams): void {
    const previousStatus = this.status$.value;

    this.error$.value = undefined;
    this.status$.value = this.hasValue() ? 'reloading' : 'loading';

    this.taskRunner.execute(
      { params, previousStatus },
      {
        onResolved: (value) => {
          this.runInActivity(() => {
            this.value$.value = value;
            this.error$.value = undefined;
            this.status$.value = 'resolved';
          });
        },
        onRejected: (error) => {
          this.runInActivity(() => {
            this.error$.value = error;
            this.status$.value = 'error';
          });
        },
      }
    );
  }

  private stopRunning(): void {
    this.taskRunner.abort();
  }

  private runInActivity(fn: () => void): void {
    if (!this.destroyed) {
      fn();
    }
  }
}

export function resource<TParams, TValue>(
  options: ResourceOptions<TParams, TValue> & { defaultValue: TValue }
): Resource<TValue>;
export function resource<TParams, TValue>(
  options: ResourceOptions<TParams, TValue>
): Resource<TValue | undefined>;
export function resource<TParams, TValue>(
  options: ResourceOptions<TParams, TValue>
): Resource<TValue | undefined> {
  return new ResourceController(options);
}
