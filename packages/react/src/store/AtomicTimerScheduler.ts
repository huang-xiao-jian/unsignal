/**
 * @see - [AtomicTimerScheduler](./AtomicTimerScheduler.md)
 */
export class AtomicTimerScheduler {
  private callbacks: (() => void)[] = [];
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(private timeout: number = 0) {}

  schedule(fn: () => void): void {
    this.callbacks.push(fn);

    if (this.timerId === null) {
      this.timerId = setTimeout(() => {
        this.timerId = null;
        const batch = this.callbacks;
        this.callbacks = [];
        batch.forEach((cb) => {
          try {
            cb();
          } catch {
            // isolate: a throwing callback does not prevent subsequent ones
          }
        });
      }, this.timeout);
    }
  }

  cancel(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
      this.callbacks = [];
    }
  }
}
