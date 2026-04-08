import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeGitRefName, isSafeGitRefName } from '../src/sanitize.js';

test('allows safe git ref names', () => {
  const safeRefs = ['main', 'feature/new-ui', 'release-1.2.3', 'bugfix.issue_123'];

  for (const ref of safeRefs) {
    assert.equal(isSafeGitRefName(ref), true);
    assert.doesNotThrow(() => assertSafeGitRefName(ref));
  }
});

test('rejects unsafe git ref names', () => {
  const unsafeRefs = ['main; rm -rf /', '../main', 'bad..name', '-danger', 'topic with space', 'dev@{1}'];

  for (const ref of unsafeRefs) {
    assert.equal(isSafeGitRefName(ref), false);
    assert.throws(() => assertSafeGitRefName(ref), /Unsafe branch name/);
  }
});
