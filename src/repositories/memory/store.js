import { generatePublicId } from '../../utils/publicId.js';
import { CATEGORIES, INTERESTS } from '../../domain/interestCatalogData.js';

/**
 * Creates an in-memory implementation of the data store. Every service in
 * this project is written against this method surface (see sqlite/store.js
 * for the persisted equivalent) so business logic can be unit-tested without
 * spinning up a real database, and so the storage layer can be swapped later
 * (e.g. for a hosted Postgres instance behind the future web dashboard)
 * without touching service code.
 */
export function createMemoryStore() {
  let nextUserId = 1;
  let nextConnectionId = 1;
  let nextReportId = 1;
  let nextNotificationId = 1;
  let nextEventId = 1;
  let nextAnnouncementId = 1;

  const users = new Map(); // id -> user
  const usersByTelegramId = new Map();
  const usersByPublicId = new Map();
  const userInterests = new Map(); // userId -> Set(interestId)
  const privacySettings = new Map();
  const notificationSettings = new Map();
  const profileViews = []; // {viewerId, viewedId, createdAt}
  const savedProfiles = new Map(); // userId -> Set(savedUserId)
  const skippedProfiles = new Map();
  const hiddenProfiles = new Map();
  const blocks = new Map(); // userId -> Set(blockedUserId)
  const connections = new Map(); // id -> connection
  const reports = [];
  const achievements = new Map();
  const userAchievements = new Map(); // userId -> Set(key)
  const streaks = new Map();
  const notifications = new Map(); // id -> notification
  const analyticsEvents = [];
  const rateLimitEvents = []; // {userId, action, createdAt}
  const announcements = [];

  const categories = CATEGORIES.map((c) => ({ ...c }));
  const interests = INTERESTS.map((i) => ({ ...i, active: 1 }));

  const now = () => new Date().toISOString();

  function defaultPrivacy(userId) {
    return {
      user_id: userId,
      show_age: 1,
      show_country: 1,
      show_interests: 1,
      allow_profile_views: 1,
      allow_connections: 1,
      appear_in_discovery: 1,
      receive_recommendations: 1,
    };
  }

  function defaultNotificationSettings(userId) {
    return {
      user_id: userId,
      new_connection_request: 1,
      connection_accepted: 1,
      profile_activity: 1,
      achievement_unlocked: 1,
      streak_milestone: 1,
      high_quality_match: 1,
      digest_mode: 0,
    };
  }

  return {
    // ---------- users ----------
    createUser({ telegramId, username, displayName }) {
      const id = nextUserId++;
      const publicId = generatePublicId();
      const user = {
        id,
        telegram_id: telegramId,
        public_id: publicId,
        username: username || null,
        display_name: displayName,
        gender: null,
        photo_file_id: null,
        bio: '',
        age: null,
        country: null,
        region: null,
        languages: [],
        goals: [],
        skills: [],
        looking_for: null,
        profile_mode: 'public',
        plan_tier: 'free',
        trust_score: 100,
        onboarding_complete: 0,
        deleted_at: null,
        created_at: now(),
        updated_at: now(),
      };
      users.set(id, user);
      usersByTelegramId.set(telegramId, id);
      usersByPublicId.set(publicId, id);
      userInterests.set(id, new Set());
      privacySettings.set(id, defaultPrivacy(id));
      notificationSettings.set(id, defaultNotificationSettings(id));
      return { ...user };
    },
    getUserById(id) {
      const u = users.get(id);
      return u ? { ...u } : null;
    },
    getUserByTelegramId(telegramId) {
      const id = usersByTelegramId.get(telegramId);
      return id ? { ...users.get(id) } : null;
    },
    getUserByPublicId(publicId) {
      const id = usersByPublicId.get(publicId);
      return id ? { ...users.get(id) } : null;
    },
    updateUser(id, patch) {
      const user = users.get(id);
      if (!user) return null;
      Object.assign(user, patch, { updated_at: now() });
      return { ...user };
    },
    deleteUserData(id) {
      // "Delete all data" — permanently removes the profile and everything
      // derived from it, rather than a soft "hide" flag.
      users.delete(id);
      usersByTelegramId.forEach((v, k) => v === id && usersByTelegramId.delete(k));
      usersByPublicId.forEach((v, k) => v === id && usersByPublicId.delete(k));
      userInterests.delete(id);
      privacySettings.delete(id);
      notificationSettings.delete(id);
      savedProfiles.delete(id);
      skippedProfiles.delete(id);
      hiddenProfiles.delete(id);
      blocks.delete(id);
      streaks.delete(id);
      userAchievements.delete(id);
      for (const [cid, c] of connections) {
        if (c.requester_id === id || c.recipient_id === id) connections.delete(cid);
      }
      for (const [nid, n] of notifications) {
        if (n.user_id === id) notifications.delete(nid);
      }
      return true;
    },
    listDiscoverableUsers(excludeUserId) {
      return [...users.values()]
        .filter((u) => u.id !== excludeUserId && !u.deleted_at && u.onboarding_complete)
        .filter((u) => privacySettings.get(u.id)?.appear_in_discovery)
        .filter((u) => u.profile_mode !== 'invisible')
        .map((u) => ({ ...u }));
    },
    countUsers() {
      return users.size;
    },
    listAllUsers() {
      return [...users.values()].filter((u) => !u.deleted_at).map((u) => ({ ...u }));
    },

    // ---------- interest catalog ----------
    listCategories() {
      return categories.map((c) => ({ ...c })).sort((a, b) => a.sort_order - b.sort_order);
    },
    listInterests({ categoryId, activeOnly = true } = {}) {
      return interests
        .filter((i) => (categoryId ? i.category_id === categoryId : true))
        .filter((i) => (activeOnly ? i.active : true))
        .map((i) => ({ ...i }));
    },
    getInterestById(id) {
      return interests.find((i) => i.id === id) || null;
    },
    setUserInterests(userId, interestIds) {
      userInterests.set(userId, new Set(interestIds));
      return [...interestIds];
    },
    getUserInterests(userId) {
      return [...(userInterests.get(userId) || [])];
    },
    countInterestMembers(interestId) {
      let count = 0;
      for (const set of userInterests.values()) if (set.has(interestId)) count++;
      return count;
    },

    // ---------- privacy / notification settings ----------
    getPrivacySettings(userId) {
      return { ...(privacySettings.get(userId) || defaultPrivacy(userId)) };
    },
    updatePrivacySettings(userId, patch) {
      const current = privacySettings.get(userId) || defaultPrivacy(userId);
      const updated = { ...current, ...patch };
      privacySettings.set(userId, updated);
      return { ...updated };
    },
    getNotificationSettings(userId) {
      return { ...(notificationSettings.get(userId) || defaultNotificationSettings(userId)) };
    },
    updateNotificationSettings(userId, patch) {
      const current = notificationSettings.get(userId) || defaultNotificationSettings(userId);
      const updated = { ...current, ...patch };
      notificationSettings.set(userId, updated);
      return { ...updated };
    },

    // ---------- interactions ----------
    recordProfileView(viewerId, viewedId) {
      profileViews.push({ viewer_id: viewerId, viewed_id: viewedId, created_at: now() });
    },
    countProfileViewsSince(viewedId, sinceIso) {
      return profileViews.filter((v) => v.viewed_id === viewedId && v.created_at >= sinceIso).length;
    },
    listRecentViewerIds(viewedId, limit = 20) {
      return profileViews
        .filter((v) => v.viewed_id === viewedId)
        .slice(-limit)
        .map((v) => v.viewer_id);
    },
    saveProfile(userId, savedUserId) {
      if (!savedProfiles.has(userId)) savedProfiles.set(userId, new Set());
      savedProfiles.get(userId).add(savedUserId);
    },
    unsaveProfile(userId, savedUserId) {
      savedProfiles.get(userId)?.delete(savedUserId);
    },
    listSavedProfileIds(userId) {
      return [...(savedProfiles.get(userId) || [])];
    },
    skipProfile(userId, skippedUserId) {
      if (!skippedProfiles.has(userId)) skippedProfiles.set(userId, new Set());
      skippedProfiles.get(userId).add(skippedUserId);
    },
    listSkippedIds(userId) {
      return [...(skippedProfiles.get(userId) || [])];
    },
    hideProfile(userId, hiddenUserId) {
      if (!hiddenProfiles.has(userId)) hiddenProfiles.set(userId, new Set());
      hiddenProfiles.get(userId).add(hiddenUserId);
    },
    listHiddenIds(userId) {
      return [...(hiddenProfiles.get(userId) || [])];
    },
    blockUser(userId, blockedUserId) {
      if (!blocks.has(userId)) blocks.set(userId, new Set());
      blocks.get(userId).add(blockedUserId);
    },
    isBlocked(userA, userB) {
      return Boolean(blocks.get(userA)?.has(userB) || blocks.get(userB)?.has(userA));
    },
    listBlockedIds(userId) {
      return [...(blocks.get(userId) || [])];
    },

    // ---------- connections ----------
    createConnectionRequest(requesterId, recipientId, message) {
      const existing = [...connections.values()].find(
        (c) => c.requester_id === requesterId && c.recipient_id === recipientId
      );
      if (existing) return { ...existing, __duplicate: true };
      const id = nextConnectionId++;
      const connection = {
        id,
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
        message: message || null,
        created_at: now(),
        responded_at: null,
      };
      connections.set(id, connection);
      return { ...connection };
    },
    getConnectionBetween(userA, userB) {
      return (
        [...connections.values()].find(
          (c) =>
            (c.requester_id === userA && c.recipient_id === userB) ||
            (c.requester_id === userB && c.recipient_id === userA)
        ) || null
      );
    },
    getConnectionById(id) {
      const c = connections.get(id);
      return c ? { ...c } : null;
    },
    updateConnectionStatus(id, status) {
      const c = connections.get(id);
      if (!c) return null;
      c.status = status;
      c.responded_at = now();
      return { ...c };
    },
    listPendingForUser(userId) {
      return [...connections.values()].filter((c) => c.recipient_id === userId && c.status === 'pending');
    },
    listAcceptedConnections(userId) {
      return [...connections.values()].filter(
        (c) => c.status === 'accepted' && (c.requester_id === userId || c.recipient_id === userId)
      );
    },
    countConnections(userId, status) {
      return [...connections.values()].filter(
        (c) => c.status === status && (c.requester_id === userId || c.recipient_id === userId)
      ).length;
    },

    // ---------- reports ----------
    createReport(reporterId, reportedId, reason) {
      const report = {
        id: nextReportId++,
        reporter_id: reporterId,
        reported_id: reportedId,
        reason,
        status: 'open',
        created_at: now(),
      };
      reports.push(report);
      return { ...report };
    },
    countReportsAgainst(userId) {
      return reports.filter((r) => r.reported_id === userId).length;
    },
    listOpenReports() {
      return reports.filter((r) => r.status === 'open').map((r) => ({ ...r }));
    },

    // ---------- achievements ----------
    seedAchievements(list) {
      for (const a of list) achievements.set(a.key, a);
    },
    listAchievements() {
      return [...achievements.values()];
    },
    hasAchievement(userId, key) {
      return Boolean(userAchievements.get(userId)?.has(key));
    },
    unlockAchievement(userId, key) {
      if (!userAchievements.has(userId)) userAchievements.set(userId, new Set());
      const set = userAchievements.get(userId);
      if (set.has(key)) return false;
      set.add(key);
      return true;
    },
    listUserAchievements(userId) {
      return [...(userAchievements.get(userId) || [])];
    },

    // ---------- streaks ----------
    getStreak(userId) {
      return streaks.get(userId) || { user_id: userId, current_streak: 0, longest_streak: 0, last_active_date: null };
    },
    upsertStreak(userId, data) {
      const current = streaks.get(userId) || { user_id: userId };
      const updated = { ...current, ...data };
      streaks.set(userId, updated);
      return { ...updated };
    },

    // ---------- notifications ----------
    createNotification(userId, type, payload) {
      const id = nextNotificationId++;
      const n = { id, user_id: userId, type, payload, read: 0, created_at: now() };
      notifications.set(id, n);
      return { ...n };
    },
    listUnreadNotifications(userId) {
      return [...notifications.values()].filter((n) => n.user_id === userId && !n.read);
    },
    listRecentNotifications(userId, limit = 20) {
      return [...notifications.values()]
        .filter((n) => n.user_id === userId)
        .slice(-limit)
        .reverse();
    },
    markNotificationsRead(ids) {
      for (const id of ids) {
        const n = notifications.get(id);
        if (n) n.read = 1;
      }
    },

    // ---------- analytics ----------
    recordEvent(eventType, userId, meta = {}) {
      analyticsEvents.push({ id: nextEventId++, event_type: eventType, user_id: userId, meta, created_at: now() });
    },
    countEventsSince(eventType, sinceIso) {
      return analyticsEvents.filter((e) => e.event_type === eventType && e.created_at >= sinceIso).length;
    },
    listEventsSince(eventType, sinceIso) {
      return analyticsEvents.filter((e) => e.event_type === eventType && e.created_at >= sinceIso);
    },

    // ---------- rate limiting ----------
    recordRateLimitAction(userId, action) {
      rateLimitEvents.push({ user_id: userId, action, created_at: now() });
    },
    countRateLimitActionsSince(userId, action, sinceIso) {
      return rateLimitEvents.filter((e) => e.user_id === userId && e.action === action && e.created_at >= sinceIso)
        .length;
    },

    // ---------- admin ----------
    createAnnouncement(message, sentBy) {
      const a = { id: nextAnnouncementId++, message, sent_by: sentBy, created_at: now() };
      announcements.push(a);
      return a;
    },
    listAllUserIds() {
      return [...users.keys()];
    },
  };
}
