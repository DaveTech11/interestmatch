import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/repositories/memory/store.js';
import { createRateLimiter, RATE_LIMITS } from '../src/services/rateLimiter.js';

test('allows actions under the configured limit', () => {
  const store = createMemoryStore();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  const rateLimiter = createRateLimiter(store);

  const limit = RATE_LIMITS.report_submit.limit;
  for (let i = 0; i < limit; i++) {
    assert.doesNotThrow(() => rateLimiter.consume(user.id, 'report_submit'));
  }
});

test('throws once the limit is exceeded', () => {
  const store = createMemoryStore();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  const rateLimiter = createRateLimiter(store);

  const limit = RATE_LIMITS.report_submit.limit;
  for (let i = 0; i < limit; i++) rateLimiter.consume(user.id, 'report_submit');
  assert.throws(() => rateLimiter.consume(user.id, 'report_submit'), /limit/);
});

test('limits are tracked independently per action', () => {
  const store = createMemoryStore();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  const rateLimiter = createRateLimiter(store);

  for (let i = 0; i < RATE_LIMITS.report_submit.limit; i++) rateLimiter.consume(user.id, 'report_submit');
  assert.doesNotThrow(() => rateLimiter.consume(user.id, 'connection_request'));
});

test('limits are tracked independently per user', () => {
  const store = createMemoryStore();
  const alice = store.createUser({ telegramId: 1, username: 'a', displayName: 'Alice' });
  const bob = store.createUser({ telegramId: 2, username: 'b', displayName: 'Bob' });
  const rateLimiter = createRateLimiter(store);

  for (let i = 0; i < RATE_LIMITS.report_submit.limit; i++) rateLimiter.consume(alice.id, 'report_submit');
  assert.doesNotThrow(() => rateLimiter.consume(bob.id, 'report_submit'));
});
