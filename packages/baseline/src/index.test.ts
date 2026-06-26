/**
 * placeholder function test for package
 */

import { describe, expect, test } from 'vitest';
import { sum } from './index';

describe('sum', () => {
  test('should return the sum of two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
