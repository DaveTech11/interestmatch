export function createTrendingService(analyticsService, interestCatalogService) {
  return {
    /** Returns top trending interests over the trailing `days`, ranked by
     * actual engagement events (profile views, discovery selections, saves,
     * connections tied to that interest) — never hard-coded numbers. */
    getTrending(days = 7, limit = 5) {
      const top = analyticsService.topInterestsSince(days, limit);
      if (top.length === 0) return [];
      return top.map(({ interestId, count }, index) => {
        const interest = interestCatalogService.getInterest(interestId);
        return {
          rank: index + 1,
          interest,
          engagementCount: count,
        };
      });
    },
  };
}
