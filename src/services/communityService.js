export function createCommunityService(store, interestCatalogService) {
  return {
    listCommunitiesByCategory(categoryId) {
      return interestCatalogService.listInterests(categoryId).map((interest) => ({
        interest,
        memberCount: store.countInterestMembers(interest.id),
      }));
    },
    getCommunity(interestId) {
      const interest = interestCatalogService.getInterest(interestId);
      if (!interest) return null;
      return {
        interest,
        memberCount: store.countInterestMembers(interestId),
      };
    },
    /** Members of a community who are discoverable, for the "Discover people" button. */
    listDiscoverableMembers(interestId, excludeUserId) {
      return store
        .listDiscoverableUsers(excludeUserId)
        .filter((u) => store.getUserInterests(u.id).includes(interestId));
    },
  };
}
