import { describe, expect, it, vi } from 'vitest';
import { sum } from './index';

describe('sum', () => {
  it('should run placeholder test', () => {
    expect(sum(1,1)).toEqual(2)
  })
})