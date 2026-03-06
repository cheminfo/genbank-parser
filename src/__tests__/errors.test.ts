import { expect, test } from 'vitest';

import { genbankToJson } from '../index.ts';

test('must be a string', () => {
  // @ts-expect-error testing invalid input
  expect(() => genbankToJson(42)).toThrow(/input must be a string/);
});
