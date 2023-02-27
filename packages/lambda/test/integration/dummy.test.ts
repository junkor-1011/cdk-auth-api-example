import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('dummy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dummy test', () => {
    expect(process.env.TZ).toBe('Asia/Tokyo');
  });
});
