import { describe, expect, it } from 'vitest';

// import { sum } from './calc.js';
import { sum } from '$lambda/lib/calc.js';

describe('sum', () => {
  it('1 + 1 = 2', () => {
    expect(sum(1, 1)).toBe(2);
  });
});
