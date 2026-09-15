export function createWeeklyReportService({ store, analyticsService, interestCatalogService }) {
  return {
    generate(userId) {
      const since = analyticsService.sinceDays(7);
      const shown = store.listEventsSince('match_shown', since).filter((e) => e.user_id === userId);
      const accepted = store
        .listEventsSince('connection_accepted', since)
        .filter((e) => e.user_id === userId);
      const engagement = store
        .listEventsSince('interest_engagement', since)
        .filter((e) => e.user_id === userId);

      const engagementCounts = new Map();
      for (const e of engagement) {
        const id = e.meta?.interestId;
        if (!id) continue;
        engagementCounts.set(id, (engagementCounts.get(id) || 0) + 1);
      }
      const strongestInterestId = [...engagementCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const strongestInterest = strongestInterestId ? interestCatalogService.getInterest(strongestInterestId) : null;

      const ownInterests = new Set(store.getUserInterests(userId));
      const newInterests = [...engagementCounts.keys()]
        .filter((id) => !ownInterests.has(id))
        .map((id) => interestCatalogService.getInterest(id))
        .filter(Boolean)
        .slice(0, 5);

      const bestMatchScore = shown.reduce((max, e) => Math.max(max, e.meta?.score || 0), 0);

      return {
        discoveredCount: shown.length,
        connectedCount: accepted.length,
        strongestInterest,
        bestMatchScore,
        newInterests,
      };
    },
  };
}
