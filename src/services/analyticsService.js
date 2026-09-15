const DAY_MS = 24 * 60 * 60 * 1000;

export function createAnalyticsService(store) {
  return {
    track(eventType, userId, meta = {}) {
      store.recordEvent(eventType, userId, meta);
    },
    sinceDays(days) {
      return new Date(Date.now() - days * DAY_MS).toISOString();
    },
    countSince(eventType, days) {
      return store.countEventsSince(eventType, this.sinceDays(days));
    },
    /** Product-health snapshot for the admin dashboard. */
    productSnapshot() {
      const since7 = this.sinceDays(7);
      return {
        totalUsers: store.countUsers(),
        newProfiles7d: store.countEventsSince('profile_created', since7),
        activeUsers7d: store.countEventsSince('user_active', since7),
        matchesGenerated7d: store.countEventsSince('match_shown', since7),
        profilesViewed7d: store.countEventsSince('profile_viewed', since7),
        connectionRequests7d: store.countEventsSince('connection_requested', since7),
        connectionsAccepted7d: store.countEventsSince('connection_accepted', since7),
        reports7d: store.countEventsSince('report_submitted', since7),
      };
    },
    topInterestsSince(days, limit = 5) {
      const since = this.sinceDays(days);
      const events = store.listEventsSince('interest_engagement', since);
      const counts = new Map();
      for (const e of events) {
        const id = e.meta?.interestId;
        if (!id) continue;
        counts.set(id, (counts.get(id) || 0) + 1);
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([interestId, count]) => ({ interestId, count }));
    },
  };
}
