import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { genbankToJson } from '../index.ts';

function readFile(filename: string): string {
  const filePath = join(import.meta.dirname, 'data', filename);
  return readFileSync(filePath, 'utf8');
}

test('parse genbank with multiple records', () => {
  const parsed = genbankToJson(readFile('multiple.gb'));
  expect(parsed).toHaveLength(94);
});
