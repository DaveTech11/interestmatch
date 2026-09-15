export const ACHIEVEMENT_CATALOG = [
  { key: 'first_profile', name: 'First Profile', emoji: '🌱', description: 'Completed your InterestMatch profile.' },
  { key: 'first_match', name: 'First Match', emoji: '🎯', description: 'Received your first personalized match.' },
  { key: 'first_connection', name: 'First Connection', emoji: '🤝', description: 'Made your first connection.' },
  { key: 'seven_day_explorer', name: '7 Day Explorer', emoji: '🔥', description: 'Discovered people 7 days in a row.' },
  {
    key: 'community_explorer',
    name: 'Community Explorer',
    emoji: '🌎',
    description: 'Selected interests across 3 or more categories.',
  },
  { key: 'tech_connector', name: 'Tech Connector', emoji: '💻', description: 'Connected over a shared technology interest.' },
  { key: 'ai_explorer', name: 'AI Explorer', emoji: '🤖', description: 'Showed interest in AI.' },
  { key: 'gaming_connector', name: 'Gaming Connector', emoji: '🎮', description: 'Connected over a shared gaming interest.' },
  { key: 'top_explorer', name: 'Top Explorer', emoji: '🏆', description: 'Discovered 50+ people on InterestMatch.' },
];

export function createAchievementService({ store, interestCatalogService, notificationService, analyticsService }) {
  function unlock(userId, key) {
    const unlocked = store.unlockAchievement(userId, key);
    if (unlocked) {
      const def = ACHIEVEMENT_CATALOG.find((a) => a.key === key);
      analyticsService.track('achievement_unlocked', userId, { key });
      notificationService.notify(userId, 'achievement_unlocked', { key, name: def.name, emoji: def.emoji });
    }
    return unlocked;
  }

  return {
    ensureSeeded() {
      store.seedAchievements(ACHIEVEMENT_CATALOG);
    },
    listCatalog() {
      return ACHIEVEMENT_CATALOG;
    },
    listUnlocked(userId) {
      const keys = new Set(store.listUserAchievements(userId));
      return ACHIEVEMENT_CATALOG.filter((a) => keys.has(a.key));
    },

    onOnboardingComplete(userId) {
      unlock(userId, 'first_profile');
      const interestIds = store.getUserInterests(userId);
      const legacyCategoryMap = new Map([
        ['ai', 'technology'], ['ai_agents', 'technology'], ['programming', 'technology'],
        ['football', 'sports'], ['afrobeats', 'music'],
      ]);
      const categories = new Set(
        interestIds.map((id) => interestCatalogService.getInterest(id)?.category_id || legacyCategoryMap.get(id)).filter(Boolean)
      );
      if (categories.size >= 3) unlock(userId, 'community_explorer');
      if (interestIds.includes('ai') || interestIds.includes('ai_agents')) unlock(userId, 'ai_explorer');
    },

    onDiscoveryResults(userId, resultsCount, totalDiscoveredCount) {
      if (resultsCount > 0) unlock(userId, 'first_match');
      if (totalDiscoveredCount >= 50) unlock(userId, 'top_explorer');
    },

    onConnectionAccepted(userAId, userBId) {
      unlock(userAId, 'first_connection');
      unlock(userBId, 'first_connection');
      const sharedCategories = new Set([
        ...store.getUserInterests(userAId).map((id) => interestCatalogService.getInterest(id)?.category_id),
      ].filter((c) => store
        .getUserInterests(userBId)
        .map((id) => interestCatalogService.getInterest(id)?.category_id)
        .includes(c)));
      const legacyTechIds = new Set(['ai', 'ai_agents', 'programming', 'coding', 'technology']);
      const aInterests = store.getUserInterests(userAId);
      const bInterests = store.getUserInterests(userBId);
      const legacyTechOverlap = aInterests.some((id) => legacyTechIds.has(id)) && bInterests.some((id) => legacyTechIds.has(id));
      if (sharedCategories.has('technology') || legacyTechOverlap) {
        unlock(userAId, 'tech_connector');
        unlock(userBId, 'tech_connector');
      }
      if (sharedCategories.has('gaming')) {
        unlock(userAId, 'gaming_connector');
        unlock(userBId, 'gaming_connector');
      }
    },

    onStreakMilestone(userId, currentStreak) {
      if (currentStreak >= 7) unlock(userId, 'seven_day_explorer');
    },
  };
}
