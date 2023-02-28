import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
  vi.resetAllMocks();
  vi.resetModules();
});
