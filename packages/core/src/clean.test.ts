import { describe, expect, it, vi } from 'vitest';
import { Cleaner } from './clean';

describe('Cleaner', () => {
  it('should register and execute cleanup functions', () => {
    const cleaner = new Cleaner();
    const spy1 = vi.fn();
    const spy2 = vi.fn();

    // Register cleanup functions
    cleaner.onCleanup(spy1);
    cleaner.onCleanup(spy2);

    // Ensure they haven't been called yet
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();

    // Trigger cleanup
    cleaner.cleanup();

    // Verify they were executed
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  it('should clear internal disposers array after cleanup is called', () => {
    const cleaner = new Cleaner();
    const spy = vi.fn();

    cleaner.onCleanup(spy);

    // First cleanup execution
    cleaner.cleanup();
    expect(spy).toHaveBeenCalledTimes(1);

    // Second cleanup execution shouldn't call the spy again
    cleaner.cleanup();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should maintain the correct "this" context for onCleanup', () => {
    const cleaner = new Cleaner();
    const spy = vi.fn();

    // Destructure onCleanup to test if "this" context is preserved
    // (Your class uses an arrow property initialization, so it should be bound automatically)
    const { onCleanup } = cleaner;

    expect(() => onCleanup(spy)).not.toThrow();

    cleaner.cleanup();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should handle being cleaned up with no registered disposers', () => {
    const cleaner = new Cleaner();

    // Calling cleanup on an empty Cleaner should not throw an error
    expect(() => cleaner.cleanup()).not.toThrow();
  });
});
