import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { genbankToJson } from '../index.ts';

function readFile(filename: string): string {
  const filePath = join(import.meta.dirname, 'data', filename);
  return readFileSync(filePath, 'utf8');
}

test('ncbi genbank example', () => {
  expect(genbankToJson(readFile('gen2.gb'))).toMatchSnapshot();
});

test('MPI genbank example', () => {
  expect(genbankToJson(readFile('gen1.gb'))).toMatchSnapshot();
});

test('geneious example 2', () => {
  expect(genbankToJson(readFile('geneious2.gb'))).toMatchSnapshot();
});

test('p5', () => {
  expect(genbankToJson(readFile('JHp0005.gb'))).toMatchSnapshot();
});
