import { describe, expect, it } from 'vitest';

describe('baseline API surface', () => {
  it('should not expose model construction APIs', async () => {
    const baselineModule = await import('./index');

    expect(baselineModule).not.toHaveProperty('createModel');
  });
});
