export function createInterestCatalogService(store) {
  return {
    listCategories() {
      return store.listCategories();
    },
    listInterests(categoryId) {
      return store.listInterests({ categoryId });
    },
    getInterest(id) {
      return store.getInterestById(id);
    },
    /** interestId(lowercase) -> categoryId, used by the scoring engine to
     * classify gaming/learning matches without hard-coding interest names. */
    buildCategoryMap() {
      const map = {};
      for (const interest of store.listInterests({})) {
        map[interest.id.toLowerCase()] = interest.category_id;
      }
      return map;
    },
    communityMemberCount(interestId) {
      return store.countInterestMembers(interestId);
    },
  };
}
