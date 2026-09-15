import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/repositories/memory/store.js';
import { createInterestCatalogService } from '../src/services/interestCatalogService.js';
import { createNotificationService } from '../src/services/notificationService.js';
import { createAnalyticsService } from '../src/services/analyticsService.js';
import { createAchievementService } from '../src/services/achievementService.js';

function setup() {
  const store = createMemoryStore();
  const interestCatalogService = createInterestCatalogService(store);
  const notificationService = createNotificationService(store);
  const analyticsService = createAnalyticsService(store);
  const achievementService = createAchievementService({ store, interestCatalogService, notificationService, analyticsService });
  achievementService.ensureSeeded();
  return { store, achievementService };
}

test('completing onboarding unlocks the First Profile achievement', () => {
  const { store, achievementService } = setup();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  store.setUserInterests(user.id, ['ai']);
  achievementService.onOnboardingComplete(user.id);
  const unlocked = achievementService.listUnlocked(user.id).map((a) => a.key);
  assert.ok(unlocked.includes('first_profile'));
  assert.ok(unlocked.includes('ai_explorer'));
});

test('selecting interests across 3+ categories unlocks Community Explorer', () => {
  const { store, achievementService } = setup();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  store.setUserInterests(user.id, ['ai', 'football', 'afrobeats']); // technology, sports, music
  achievementService.onOnboardingComplete(user.id);
  const unlocked = achievementService.listUnlocked(user.id).map((a) => a.key);
  assert.ok(unlocked.includes('community_explorer'));
});

test('achievements only unlock once', () => {
  const { store, achievementService } = setup();
  const user = store.createUser({ telegramId: 1, username: 'a', displayName: 'A' });
  store.setUserInterests(user.id, ['ai']);
  achievementService.onOnboardingComplete(user.id);
  achievementService.onOnboardingComplete(user.id);
  const unlocked = achievementService.listUnlocked(user.id).filter((a) => a.key === 'first_profile');
  assert.equal(unlocked.length, 1);
});

test('an accepted connection over a shared tech interest unlocks Tech Connector for both users', () => {
  const { store, achievementService } = setup();
  const alice = store.createUser({ telegramId: 1, username: 'a', displayName: 'Alice' });
  const bob = store.createUser({ telegramId: 2, username: 'b', displayName: 'Bob' });
  store.setUserInterests(alice.id, ['ai']);
  store.setUserInterests(bob.id, ['programming']);

  achievementService.onConnectionAccepted(alice.id, bob.id);

  const aliceUnlocked = achievementService.listUnlocked(alice.id).map((a) => a.key);
  const bobUnlocked = achievementService.listUnlocked(bob.id).map((a) => a.key);
  assert.ok(aliceUnlocked.includes('first_connection'));
  assert.ok(aliceUnlocked.includes('tech_connector'));
  assert.ok(bobUnlocked.includes('tech_connector'));
});
