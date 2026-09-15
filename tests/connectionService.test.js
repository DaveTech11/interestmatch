import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/repositories/memory/store.js';
import { createConnectionService } from '../src/services/connectionService.js';
import { createRateLimiter } from '../src/services/rateLimiter.js';
import { createNotificationService } from '../src/services/notificationService.js';
import { createAnalyticsService } from '../src/services/analyticsService.js';

function setup() {
  const store = createMemoryStore();
  const rateLimiter = createRateLimiter(store);
  const notificationService = createNotificationService(store);
  const analyticsService = createAnalyticsService(store);
  const connectionService = createConnectionService({ store, rateLimiter, notificationService, analyticsService });
  const alice = store.createUser({ telegramId: 1, username: 'alice', displayName: 'Alice' });
  const bob = store.createUser({ telegramId: 2, username: 'bob', displayName: 'Bob' });
  return { store, connectionService, alice, bob };
}

test('sending a connection request creates a pending connection', () => {
  const { connectionService, alice, bob } = setup();
  const connection = connectionService.sendRequest(alice.id, bob.id, 'Hi there');
  assert.equal(connection.status, 'pending');
  assert.equal(connection.requester_id, alice.id);
  assert.equal(connection.recipient_id, bob.id);
});

test('duplicate connection requests are rejected', () => {
  const { connectionService, alice, bob } = setup();
  connectionService.sendRequest(alice.id, bob.id);
  assert.throws(() => connectionService.sendRequest(alice.id, bob.id), /already sent/);
});

test('a blocked user cannot send a connection request', () => {
  const { store, connectionService, alice, bob } = setup();
  store.blockUser(bob.id, alice.id);
  assert.throws(() => connectionService.sendRequest(alice.id, bob.id), /cannot connect/);
});

test('a user with connections disabled cannot receive requests', () => {
  const { store, connectionService, alice, bob } = setup();
  store.updatePrivacySettings(bob.id, { allow_connections: 0 });
  assert.throws(() => connectionService.sendRequest(alice.id, bob.id), /not accepting/);
});

test('accepting a connection updates its status and notifies the requester', () => {
  const { connectionService, alice, bob } = setup();
  const connection = connectionService.sendRequest(alice.id, bob.id);
  const updated = connectionService.respond(connection.id, bob.id, true);
  assert.equal(updated.status, 'accepted');
});

test('only the recipient can respond to a request', () => {
  const { connectionService, alice, bob } = setup();
  const connection = connectionService.sendRequest(alice.id, bob.id);
  assert.throws(() => connectionService.respond(connection.id, alice.id, true), /cannot respond/);
});

test('a request cannot be answered twice', () => {
  const { connectionService, alice, bob } = setup();
  const connection = connectionService.sendRequest(alice.id, bob.id);
  connectionService.respond(connection.id, bob.id, true);
  assert.throws(() => connectionService.respond(connection.id, bob.id, false), /already been answered/);
});

test('connection requests are rate limited', () => {
  const { store, connectionService, alice } = setup();
  for (let i = 0; i < 15; i++) {
    const target = store.createUser({ telegramId: 100 + i, username: `u${i}`, displayName: `U${i}` });
    connectionService.sendRequest(alice.id, target.id);
  }
  const oneMore = store.createUser({ telegramId: 999, username: 'over', displayName: 'Over' });
  assert.throws(() => connectionService.sendRequest(alice.id, oneMore.id), /limit/);
});
