export function createStatsService({ store, analyticsService, achievementService, streakService }) {
  return {
    getUserStats(userId) {
      const since = analyticsService.sinceDays(3650); // effectively "all time"
      const shown = store.listEventsSince('match_shown', since).filter((e) => e.user_id === userId);
      const viewed = store.listEventsSince('profile_viewed', since).filter((e) => e.user_id === userId);
      const interested = store.listEventsSince('connection_requested', since).filter((e) => e.user_id === userId);

      const bestMatch = shown.reduce((max, e) => Math.max(max, e.meta?.score || 0), 0);
      const streak = streakService.get(userId);
      const achievements = achievementService.listUnlocked(userId);

      return {
        peopleDiscovered: shown.length,
        profilesViewed: viewed.length,
        interested: interested.length,
        connections: store.countConnections(userId, 'accepted'),
        streak: streak.current_streak,
        bestMatch,
        achievementsCount: achievements.length,
      };
    },
  };
}
