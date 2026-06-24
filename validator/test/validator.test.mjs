import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateOrgfText } from '../src/validate-orgf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('accepts the self-contained minimal example', () => {
  const text = fs.readFileSync(path.join(root, 'examples/minimal-self-contained.orgf'), 'utf8');
  const issues = validateOrgfText(text);
  assert.equal(issues.filter((issue) => issue.level === 'error').length, 0);
  assert.equal(issues.length, 0);
});

test('reports a hidden branch inconsistency as a remark, not an error', () => {
  const text = `orgformat: "1.0.0"\nmeta: {}\nroot:\n  name: Root\n  hidden: true\n  children:\n    - name: Child\n`;
  const issues = validateOrgfText(text);
  assert.equal(issues.filter((issue) => issue.level === 'error').length, 0);
  assert.ok(issues.some((issue) => issue.path.endsWith('.hidden') && issue.level === 'remark'));
});

test('rejects a missing root block', () => {
  const issues = validateOrgfText(`orgformat: "1.0.0"\nmeta: {}\n`);
  assert.ok(issues.some((issue) => issue.path === 'root' && issue.level === 'error'));
});
