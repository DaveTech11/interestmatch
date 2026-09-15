import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/repositories/memory/store.js';
import { createPrivacyService } from '../src/services/privacyService.js';

test('toggling a privacy field flips it', () => {
  const store = createMemoryStore();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  const privacyService = createPrivacyService(store);

  const before = privacyService.getSettings(user.id);
  assert.equal(before.appear_in_discovery, 1);

  const after = privacyService.toggle(user.id, 'appear_in_discovery');
  assert.equal(after.appear_in_discovery, 0);

  const toggledBack = privacyService.toggle(user.id, 'appear_in_discovery');
  assert.equal(toggledBack.appear_in_discovery, 1);
});

test('toggling an unknown field throws', () => {
  const store = createMemoryStore();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  const privacyService = createPrivacyService(store);
  assert.throws(() => privacyService.toggle(user.id, 'not_a_real_field'));
});

test('a user with discovery disabled does not appear in listDiscoverableUsers', () => {
  const store = createMemoryStore();
  const viewer = store.createUser({ telegramId: 1, username: 'v', displayName: 'Viewer' });
  const target = store.createUser({ telegramId: 2, username: 't', displayName: 'Target' });
  store.updateUser(target.id, { onboarding_complete: 1 });
  store.updatePrivacySettings(target.id, { appear_in_discovery: 0 });

  const discoverable = store.listDiscoverableUsers(viewer.id);
  assert.ok(!discoverable.some((u) => u.id === target.id));
});

test('deleteAllData permanently removes the user and their connections', () => {
  const store = createMemoryStore();
  const privacyService = createPrivacyService(store);
  const alice = store.createUser({ telegramId: 1, username: 'a', displayName: 'Alice' });
  const bob = store.createUser({ telegramId: 2, username: 'b', displayName: 'Bob' });
  store.createConnectionRequest(alice.id, bob.id, 'hi');

  privacyService.deleteAllData(alice.id);

  assert.equal(store.getUserById(alice.id), null);
  assert.equal(store.getConnectionBetween(alice.id, bob.id), null);
});
