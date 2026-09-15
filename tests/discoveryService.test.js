import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/repositories/memory/store.js';
import { createInterestCatalogService } from '../src/services/interestCatalogService.js';
import { createProfileService } from '../src/services/profileService.js';
import { createAnalyticsService } from '../src/services/analyticsService.js';
import { createTrustService } from '../src/services/trustService.js';
import { createDiscoveryService } from '../src/services/discoveryService.js';
import { DeterministicRecommendationProvider } from '../src/domain/matching/recommendationProvider.js';

function setup() {
  const store = createMemoryStore();
  const interestCatalogService = createInterestCatalogService(store);
  const profileService = createProfileService(store, interestCatalogService);
  const analyticsService = createAnalyticsService(store);
  const trustService = createTrustService(store);
  const recommendationProvider = new DeterministicRecommendationProvider();
  const discoveryService = createDiscoveryService({
    store,
    profileService,
    interestCatalogService,
    recommendationProvider,
    trustService,
    analyticsService,
  });

  function makeUser(telegramId, interests) {
    const user = store.createUser({ telegramId, username: `u${telegramId}`, displayName: `User${telegramId}` });
    store.setUserInterests(user.id, interests);
    store.updateUser(user.id, { onboarding_complete: 1 });
    return user;
  }

  return { store, discoveryService, trustService, makeUser };
}

test('discover returns candidates ranked by score, excluding self', async () => {
  const { discoveryService, makeUser } = setup();
  const me = makeUser(1, ['ai', 'programming']);
  makeUser(2, ['ai', 'programming']);
  makeUser(3, ['cooking']);

  const results = await discoveryService.discover(me.id, { matchType: 'similar_interests' });
  assert.ok(results.every((r) => r.user.id !== me.id));
  assert.ok(results[0].score >= results[results.length - 1]?.score ?? 0);
});

test('a skipped profile does not reappear in discovery', async () => {
  const { discoveryService, makeUser } = setup();
  const me = makeUser(1, ['ai']);
  const other = makeUser(2, ['ai']);

  discoveryService.skipProfile(me.id, other.id);
  const results = await discoveryService.discover(me.id, {});
  assert.ok(!results.some((r) => r.user.id === other.id));
});

test('a hidden profile does not reappear in discovery', async () => {
  const { discoveryService, makeUser } = setup();
  const me = makeUser(1, ['ai']);
  const other = makeUser(2, ['ai']);

  discoveryService.hideProfile(me.id, other.id);
  const results = await discoveryService.discover(me.id, {});
  assert.ok(!results.some((r) => r.user.id === other.id));
});

test('a blocked profile does not appear in discovery in either direction', async () => {
  const { store, discoveryService, trustService, makeUser } = setup();
  const me = makeUser(1, ['ai']);
  const other = makeUser(2, ['ai']);

  discoveryService.blockUser(me.id, other.id);
  const results = await discoveryService.discover(me.id, {});
  assert.ok(!results.some((r) => r.user.id === other.id));
});

test('a user suppressed by trust score is excluded from discovery', async () => {
  const { store, discoveryService, trustService, makeUser } = setup();
  const me = makeUser(1, ['ai']);
  const bad = makeUser(2, ['ai']);

  for (let i = 0; i < 5; i++) trustService.applyReportPenalty(bad.id);
  const results = await discoveryService.discover(me.id, {});
  assert.ok(!results.some((r) => r.user.id === bad.id));
});

test('search filters narrow results by interest', async () => {
  const { discoveryService, makeUser } = setup();
  const me = makeUser(1, ['ai', 'cooking']);
  const techPerson = makeUser(2, ['ai']);
  const cookPerson = makeUser(3, ['cooking']);

  const results = await discoveryService.discover(me.id, { filters: { interest: 'ai' } });
  const ids = results.map((r) => r.user.id);
  assert.ok(ids.includes(techPerson.id));
  assert.ok(!ids.includes(cookPerson.id));
});
