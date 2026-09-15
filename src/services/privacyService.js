const TOGGLEABLE_FIELDS = [
  'show_age',
  'show_country',
  'show_interests',
  'allow_profile_views',
  'allow_connections',
  'appear_in_discovery',
  'receive_recommendations',
];

export function createPrivacyService(store) {
  return {
    getSettings(userId) {
      return store.getPrivacySettings(userId);
    },
    toggle(userId, field) {
      if (!TOGGLEABLE_FIELDS.includes(field)) {
        throw new Error(`Unknown privacy field: ${field}`);
      }
      const current = store.getPrivacySettings(userId);
      const next = current[field] ? 0 : 1;
      return store.updatePrivacySettings(userId, { [field]: next });
    },
    getNotificationSettings(userId) {
      return store.getNotificationSettings(userId);
    },
    toggleNotification(userId, field) {
      const current = store.getNotificationSettings(userId);
      const next = current[field] ? 0 : 1;
      return store.updateNotificationSettings(userId, { [field]: next });
    },
    /** Permanently deletes the profile and everything derived from it. */
    deleteAllData(userId) {
      return store.deleteUserData(userId);
    },
    fields: TOGGLEABLE_FIELDS,
  };
}
