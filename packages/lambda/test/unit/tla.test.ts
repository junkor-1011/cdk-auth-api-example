import { expect, test } from 'vitest';

const awaitedValue: string = await (async () => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return 'awaited';
})();

test('top level await', () => {
  expect(awaitedValue).toBe('awaited');
});
