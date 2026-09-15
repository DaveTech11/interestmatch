import { EventEmitter } from 'node:events';

const TYPE_TO_SETTING = {
  new_connection_request: 'new_connection_request',
  connection_accepted: 'connection_accepted',
  profile_activity: 'profile_activity',
  achievement_unlocked: 'achievement_unlocked',
  streak_milestone: 'streak_milestone',
  high_quality_match: 'high_quality_match',
};

export function createNotificationService(store) {
  const emitter = new EventEmitter();

  return {
    /** Subscribe to real-time pushes — bot/app.js listens here to actually
     * send a Telegram message. Kept decoupled so services never import the
     * Telegram client directly. */
    onPush(listener) {
      emitter.on('push', listener);
    },

    notify(userId, type, payload = {}) {
      const settingField = TYPE_TO_SETTING[type];
      const settings = store.getNotificationSettings(userId);
      if (settingField && settings && !settings[settingField]) {
        return null; // user opted out of this notification type
      }
      const notification = store.createNotification(userId, type, payload);
      if (!settings?.digest_mode) {
        emitter.emit('push', { userId, type, payload, notificationId: notification.id });
      }
      return notification;
    },

    listUnread(userId) {
      return store.listUnreadNotifications(userId);
    },
    listRecent(userId, limit = 20) {
      return store.listRecentNotifications(userId, limit);
    },
    markRead(ids) {
      store.markNotificationsRead(ids);
    },

    /** Builds a grouped digest summary for users with digest_mode enabled. */
    buildDigest(userId) {
      const unread = store.listUnreadNotifications(userId);
      if (unread.length === 0) return null;
      const counts = {};
      for (const n of unread) counts[n.type] = (counts[n.type] || 0) + 1;
      return { total: unread.length, byType: counts, ids: unread.map((n) => n.id) };
    },
  };
}
