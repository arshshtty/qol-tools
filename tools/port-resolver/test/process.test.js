import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTaskkillArgs, sanitizePid } from '../src/process.js';

test('sanitizePid accepts positive integer-like values', () => {
  assert.equal(sanitizePid(1234), 1234);
  assert.equal(sanitizePid('5678'), 5678);
  assert.equal(sanitizePid(' 42 '), 42);
});

test('sanitizePid rejects unsafe values', () => {
  const invalidPids = ['1; calc', '-1', 'abc', '3.14', ''];

  for (const pid of invalidPids) {
    assert.throws(() => sanitizePid(pid), /Invalid process id/);
  }
});

test('buildTaskkillArgs returns sanitized argument array', () => {
  assert.deepEqual(buildTaskkillArgs('99'), ['/PID', '99', '/F']);
  assert.deepEqual(buildTaskkillArgs(101, false), ['/PID', '101']);
});
