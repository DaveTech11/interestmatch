import { generatePublicId } from '../../utils/publicId.js';

function toJson(v) {
  return JSON.stringify(v ?? []);
}
function fromJson(v) {
  try {
    return JSON.parse(v ?? '[]');
  } catch {
    return [];
  }
}
function boolToInt(v) {
  return v ? 1 : 0;
}
function rowToUser(row) {
  if (!row) return null;
  return {
    ...row,
    languages: fromJson(row.languages),
    goals: fromJson(row.goals),
    skills: fromJson(row.skills),
    onboarding_complete: Boolean(row.onboarding_complete),
  };
}

export function createSqliteStore(db) {
  const stmt = (sql) => db.prepare(sql);

  const s = {
    insertUser: stmt(
      `INSERT INTO users (telegram_id, public_id, username, display_name) VALUES (?, ?, ?, ?)`
    ),
    getUserById: stmt(`SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`),
    getUserByTelegramId: stmt(`SELECT * FROM users WHERE telegram_id = ? AND deleted_at IS NULL`),
    getUserByPublicId: stmt(`SELECT * FROM users WHERE public_id = ? AND deleted_at IS NULL`),
    insertPrivacyDefaults: stmt(`INSERT INTO privacy_settings (user_id) VALUES (?)`),
    insertNotificationDefaults: stmt(`INSERT INTO notification_settings (user_id) VALUES (?)`),
    listCategories: stmt(`SELECT * FROM interest_categories ORDER BY sort_order`),
    listInterestsAll: stmt(`SELECT * FROM interests WHERE active = 1`),
    listInterestsByCategory: stmt(`SELECT * FROM interests WHERE active = 1 AND category_id = ?`),
    getInterestById: stmt(`SELECT * FROM interests WHERE id = ?`),
    deleteUserInterests: stmt(`DELETE FROM user_interests WHERE user_id = ?`),
    insertUserInterest: stmt(`INSERT OR IGNORE INTO user_interests (user_id, interest_id) VALUES (?, ?)`),
    getUserInterests: stmt(`SELECT interest_id FROM user_interests WHERE user_id = ?`),
    countInterestMembers: stmt(`SELECT COUNT(*) AS n FROM user_interests WHERE interest_id = ?`),
    getPrivacy: stmt(`SELECT * FROM privacy_settings WHERE user_id = ?`),
    getNotificationSettings: stmt(`SELECT * FROM notification_settings WHERE user_id = ?`),
    insertProfileView: stmt(`INSERT INTO profile_views (viewer_id, viewed_id) VALUES (?, ?)`),
    countProfileViewsSince: stmt(
      `SELECT COUNT(*) AS n FROM profile_views WHERE viewed_id = ? AND created_at >= ?`
    ),
    listRecentViewerIds: stmt(
      `SELECT viewer_id FROM profile_views WHERE viewed_id = ? ORDER BY created_at DESC LIMIT ?`
    ),
    insertSaved: stmt(`INSERT OR IGNORE INTO saved_profiles (user_id, saved_user_id) VALUES (?, ?)`),
    deleteSaved: stmt(`DELETE FROM saved_profiles WHERE user_id = ? AND saved_user_id = ?`),
    listSaved: stmt(`SELECT saved_user_id FROM saved_profiles WHERE user_id = ?`),
    insertSkipped: stmt(`INSERT OR IGNORE INTO skipped_profiles (user_id, skipped_user_id) VALUES (?, ?)`),
    listSkipped: stmt(`SELECT skipped_user_id FROM skipped_profiles WHERE user_id = ?`),
    insertHidden: stmt(`INSERT OR IGNORE INTO hidden_profiles (user_id, hidden_user_id) VALUES (?, ?)`),
    listHidden: stmt(`SELECT hidden_user_id FROM hidden_profiles WHERE user_id = ?`),
    insertBlock: stmt(`INSERT OR IGNORE INTO blocks (user_id, blocked_user_id) VALUES (?, ?)`),
    insertLike: stmt(`INSERT OR IGNORE INTO match_likes (user_id, liked_user_id, is_super) VALUES (?, ?, ?)`),
    getLike: stmt(`SELECT * FROM match_likes WHERE user_id = ? AND liked_user_id = ?`),
    getReverseLike: stmt(`SELECT * FROM match_likes WHERE user_id = ? AND liked_user_id = ?`),
    insertPass: stmt(`INSERT OR IGNORE INTO match_passes (user_id, passed_user_id) VALUES (?, ?)`),
    getPass: stmt(`SELECT 1 FROM match_passes WHERE user_id = ? AND passed_user_id = ?`),
    insertDailyMatch: stmt(`INSERT OR IGNORE INTO daily_matches (user_id, match_date, matched_user_id, score) VALUES (?, ?, ?, ?)`),
    getDailyMatch: stmt(`SELECT * FROM daily_matches WHERE user_id = ? AND match_date = ?`),
    getMatchPreferences: stmt(`SELECT * FROM match_preferences WHERE user_id = ?`),
    upsertMatchPreferences: stmt(`INSERT INTO match_preferences (user_id, min_age, max_age, nearby_only, custom_request, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET min_age=excluded.min_age, max_age=excluded.max_age, nearby_only=excluded.nearby_only, custom_request=excluded.custom_request, updated_at=datetime('now')`),
    listBlocked: stmt(`SELECT blocked_user_id FROM blocks WHERE user_id = ?`),
    isBlocked: stmt(
      `SELECT 1 FROM blocks WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)`
    ),
    insertConnection: stmt(
      `INSERT INTO connections (requester_id, recipient_id, message) VALUES (?, ?, ?)`
    ),
    getConnectionExact: stmt(
      `SELECT * FROM connections WHERE requester_id = ? AND recipient_id = ?`
    ),
    getConnectionBetween: stmt(
      `SELECT * FROM connections WHERE (requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?)`
    ),
    getConnectionById: stmt(`SELECT * FROM connections WHERE id = ?`),
    updateConnectionStatus: stmt(
      `UPDATE connections SET status = ?, responded_at = datetime('now') WHERE id = ?`
    ),
    reopenConnection: stmt(`UPDATE connections SET status = 'pending', responded_at = NULL WHERE id = ?`),
    listPendingForUser: stmt(`SELECT * FROM connections WHERE recipient_id = ? AND status = 'pending'`),
    listAcceptedConnections: stmt(
      `SELECT * FROM connections WHERE status = 'accepted' AND (requester_id = ? OR recipient_id = ?)`
    ),
    countConnections: stmt(
      `SELECT COUNT(*) AS n FROM connections WHERE status = ? AND (requester_id = ? OR recipient_id = ?)`
    ),
    insertReport: stmt(`INSERT INTO reports (reporter_id, reported_id, reason) VALUES (?, ?, ?)`),
    countReportsAgainst: stmt(`SELECT COUNT(*) AS n FROM reports WHERE reported_id = ?`),
    listOpenReports: stmt(`SELECT * FROM reports WHERE status = 'open'`),
    insertAchievement: stmt(
      `INSERT OR IGNORE INTO achievements (key, name, emoji, description) VALUES (?, ?, ?, ?)`
    ),
    listAchievements: stmt(`SELECT * FROM achievements`),
    hasAchievement: stmt(
      `SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_key = ?`
    ),
    unlockAchievement: stmt(
      `INSERT OR IGNORE INTO user_achievements (user_id, achievement_key) VALUES (?, ?)`
    ),
    listUserAchievements: stmt(`SELECT achievement_key FROM user_achievements WHERE user_id = ?`),
    getStreak: stmt(`SELECT * FROM streaks WHERE user_id = ?`),
    upsertStreak: stmt(
      `INSERT INTO streaks (user_id, current_streak, longest_streak, last_active_date)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET current_streak=excluded.current_streak,
         longest_streak=excluded.longest_streak, last_active_date=excluded.last_active_date`
    ),
    insertNotification: stmt(
      `INSERT INTO notifications (user_id, type, payload) VALUES (?, ?, ?)`
    ),
    listUnreadNotifications: stmt(`SELECT * FROM notifications WHERE user_id = ? AND read = 0`),
    listRecentNotifications: stmt(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    ),
    insertEvent: stmt(`INSERT INTO analytics_events (event_type, user_id, meta) VALUES (?, ?, ?)`),
    countEventsSince: stmt(
      `SELECT COUNT(*) AS n FROM analytics_events WHERE event_type = ? AND created_at >= ?`
    ),
    listEventsSince: stmt(
      `SELECT * FROM analytics_events WHERE event_type = ? AND created_at >= ?`
    ),
    insertRateLimitEvent: stmt(`INSERT INTO rate_limit_events (user_id, action) VALUES (?, ?)`),
    countRateLimitActionsSince: stmt(
      `SELECT COUNT(*) AS n FROM rate_limit_events WHERE user_id = ? AND action = ? AND created_at >= ?`
    ),
    insertAnnouncement: stmt(`INSERT INTO admin_announcements (message, sent_by) VALUES (?, ?)`),
    countUsers: stmt(`SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL`),
    listAllUserIds: stmt(`SELECT id FROM users WHERE deleted_at IS NULL`),
    touchUser: stmt(`UPDATE users SET last_active_at = datetime('now') WHERE id = ?`),
    addPhoto: stmt(`INSERT OR IGNORE INTO profile_photos (user_id,file_id,sort_order) VALUES (?,?,?)`),
    listPhotos: stmt(`SELECT file_id FROM profile_photos WHERE user_id = ? ORDER BY sort_order, id`),
    removePhoto: stmt(`DELETE FROM profile_photos WHERE user_id = ? AND file_id = ?`),
    listLikedYou: stmt(`SELECT user_id, is_super, created_at FROM match_likes WHERE liked_user_id = ? AND user_id != ? ORDER BY is_super DESC, created_at DESC LIMIT ?`),
    deletePass: stmt(`DELETE FROM match_passes WHERE user_id = ? AND passed_user_id = ?`),
    listPasses: stmt(`SELECT passed_user_id, created_at FROM match_passes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`),
    setVip: stmt(`UPDATE users SET vip_until = ?, plan_tier = ? WHERE id = ?`),
    resolveReport: stmt(`UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = datetime('now'), resolution_note = ? WHERE id = ?`),
    insertMatchHistory: stmt(`INSERT INTO match_history (user_id,target_user_id,action,score) VALUES (?,?,?,?)`),
    listMatchHistory: stmt(`SELECT * FROM match_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`),
    insertMessageReaction: stmt(`INSERT OR IGNORE INTO message_reactions (sender_id,recipient_id,telegram_message_id,reaction) VALUES (?,?,?,?)`),
    listMessageReactions: stmt(`SELECT reaction, COUNT(*) AS count FROM message_reactions WHERE recipient_id = ? GROUP BY reaction ORDER BY count DESC`),
  };

  function markUpdated(id) {
    db.prepare(`UPDATE users SET updated_at = datetime('now') WHERE id = ?`).run(id);
  }

  return {
    // ---------- users ----------
    createUser({ telegramId, username, displayName }) {
      const publicId = generatePublicId();
      const info = s.insertUser.run(telegramId, publicId, username || null, displayName);
      s.insertPrivacyDefaults.run(info.lastInsertRowid);
      s.insertNotificationDefaults.run(info.lastInsertRowid);
      return rowToUser(s.getUserById.get(info.lastInsertRowid));
    },
    getUserById(id) {
      return rowToUser(s.getUserById.get(id));
    },
    getUserByTelegramId(telegramId) {
      return rowToUser(s.getUserByTelegramId.get(telegramId));
    },
    getUserByPublicId(publicId) {
      return rowToUser(s.getUserByPublicId.get(publicId));
    },
    listAllUsers() { return s.listAllUserIds.all().map((r) => rowToUser(s.getUserById.get(r.id))).filter(Boolean); },
    updateUser(id, patch) {
      const fields = [];
      const values = [];
      const jsonFields = new Set(['languages', 'goals', 'skills']);
      for (const [key, value] of Object.entries(patch)) {
        fields.push(`${key} = ?`);
        values.push(jsonFields.has(key) ? toJson(value) : typeof value === 'boolean' ? boolToInt(value) : value);
      }
      if (fields.length === 0) return this.getUserById(id);
      values.push(id);
      db.prepare(`UPDATE users SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);
      return this.getUserById(id);
    },
    deleteUserData(id) {
      // Real deletion (per privacy spec), not a soft flag: children cascade
      // via ON DELETE CASCADE / SET NULL as defined in the schema.
      db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
      return true;
    },
    listDiscoverableUsers(excludeUserId) {
      const rows = db
        .prepare(
          `SELECT u.* FROM users u
           JOIN privacy_settings p ON p.user_id = u.id
           WHERE u.id != ? AND u.deleted_at IS NULL AND u.onboarding_complete = 1
             AND p.appear_in_discovery = 1 AND u.profile_mode != 'invisible'`
        )
        .all(excludeUserId);
      return rows.map(rowToUser);
    },
    countUsers() {
      return s.countUsers.get().n;
    },
    touchUser(userId) { s.touchUser.run(userId); },
    addProfilePhoto(userId, fileId, sortOrder = 0) { s.addPhoto.run(userId, fileId, sortOrder); },
    listProfilePhotos(userId) { return s.listPhotos.all(userId).map((r) => r.file_id); },
    removeProfilePhoto(userId, fileId) { s.removePhoto.run(userId, fileId); },
    listLikedYou(userId, limit = 50) { return s.listLikedYou.all(userId, userId, limit); },
    rewindPass(userId, targetUserId) { return s.deletePass.run(userId, targetUserId).changes > 0; },
    listRecentPasses(userId, limit = 10) { return s.listPasses.all(userId, limit); },
    setVip(userId, until, tier = 'plus') { s.setVip.run(until, tier, userId); return this.getUserById(userId); },
    resolveReport(reportId, status, adminId, note = '') { return s.resolveReport.run(status, adminId, note, reportId).changes > 0; },
    recordMatchHistory(userId, targetUserId, action, score = null) { s.insertMatchHistory.run(userId, targetUserId, action, score); },
    listMatchHistory(userId, limit = 30) { return s.listMatchHistory.all(userId, limit); },
    addMessageReaction(senderId, recipientId, messageId, reaction) { return s.insertMessageReaction.run(senderId, recipientId, Number(messageId), reaction).changes > 0; },
    getMessageReactionSummary(recipientId) { return s.listMessageReactions.all(recipientId); },

    // ---------- interest catalog ----------
    listCategories() {
      return s.listCategories.all();
    },
    listInterests({ categoryId } = {}) {
      return categoryId ? s.listInterestsByCategory.all(categoryId) : s.listInterestsAll.all();
    },
    getInterestById(id) {
      return s.getInterestById.get(id) || null;
    },
    setUserInterests(userId, interestIds) {
      s.deleteUserInterests.run(userId);
      for (const id of interestIds) s.insertUserInterest.run(userId, id);
      markUpdated(userId);
      return interestIds;
    },
    getUserInterests(userId) {
      return s.getUserInterests.all(userId).map((r) => r.interest_id);
    },
    countInterestMembers(interestId) {
      return s.countInterestMembers.get(interestId).n;
    },

    // ---------- privacy / notification settings ----------
    createLike(userId, likedUserId, isSuper = false) {
      const existing = s.getLike.get(userId, likedUserId);
      if (existing) return { duplicate: true, mutual: Boolean(s.getReverseLike.get(likedUserId, userId)) };
      s.insertLike.run(userId, likedUserId, isSuper ? 1 : 0);
      return { duplicate: false, mutual: Boolean(s.getReverseLike.get(likedUserId, userId)), isSuper: Boolean(isSuper) };
    },
    hasLike(userId, targetUserId) { return Boolean(s.getLike.get(userId, targetUserId)); },
    hasPassed(userId, targetUserId) { return Boolean(s.getPass.get(userId, targetUserId)); },
    recordPass(userId, targetUserId) { s.insertPass.run(userId, targetUserId); },
    getDailyMatch(userId, matchDate) { return s.getDailyMatch.get(userId, matchDate) || null; },
    saveDailyMatch(userId, targetUserId, score, matchDate) { s.insertDailyMatch.run(userId, matchDate, targetUserId, score); },
    getMatchPreferences(userId) { return s.getMatchPreferences.get(userId) || { user_id: userId, min_age: null, max_age: null, nearby_only: 0, custom_request: '' }; },
    updateMatchPreferences(userId, patch = {}) { const cur=this.getMatchPreferences(userId); const next={...cur,...patch}; s.upsertMatchPreferences.run(userId,next.min_age ?? null,next.max_age ?? null,next.nearby_only ? 1 : 0,next.custom_request || ''); return this.getMatchPreferences(userId); },

    getPrivacySettings(userId) {
      return s.getPrivacy.get(userId);
    },
    updatePrivacySettings(userId, patch) {
      const fields = Object.keys(patch)
        .map((k) => `${k} = ?`)
        .join(', ');
      const values = Object.values(patch).map((v) => (typeof v === 'boolean' ? boolToInt(v) : v));
      if (fields) db.prepare(`UPDATE privacy_settings SET ${fields} WHERE user_id = ?`).run(...values, userId);
      return s.getPrivacy.get(userId);
    },
    getNotificationSettings(userId) {
      return s.getNotificationSettings.get(userId);
    },
    updateNotificationSettings(userId, patch) {
      const fields = Object.keys(patch)
        .map((k) => `${k} = ?`)
        .join(', ');
      const values = Object.values(patch).map((v) => (typeof v === 'boolean' ? boolToInt(v) : v));
      if (fields)
        db.prepare(`UPDATE notification_settings SET ${fields} WHERE user_id = ?`).run(...values, userId);
      return s.getNotificationSettings.get(userId);
    },

    // ---------- interactions ----------
    recordProfileView(viewerId, viewedId) {
      s.insertProfileView.run(viewerId, viewedId);
    },
    countProfileViewsSince(viewedId, sinceIso) {
      return s.countProfileViewsSince.get(viewedId, sinceIso).n;
    },
    listRecentViewerIds(viewedId, limit = 20) {
      return s.listRecentViewerIds.all(viewedId, limit).map((r) => r.viewer_id);
    },
    saveProfile(userId, savedUserId) {
      s.insertSaved.run(userId, savedUserId);
    },
    unsaveProfile(userId, savedUserId) {
      s.deleteSaved.run(userId, savedUserId);
    },
    listSavedProfileIds(userId) {
      return s.listSaved.all(userId).map((r) => r.saved_user_id);
    },
    skipProfile(userId, skippedUserId) {
      s.insertSkipped.run(userId, skippedUserId);
    },
    listSkippedIds(userId) {
      return s.listSkipped.all(userId).map((r) => r.skipped_user_id);
    },
    hideProfile(userId, hiddenUserId) {
      s.insertHidden.run(userId, hiddenUserId);
    },
    listHiddenIds(userId) {
      return s.listHidden.all(userId).map((r) => r.hidden_user_id);
    },
    blockUser(userId, blockedUserId) {
      s.insertBlock.run(userId, blockedUserId);
    },
    isBlocked(userA, userB) {
      return Boolean(s.isBlocked.get(userA, userB, userB, userA));
    },
    listBlockedIds(userId) {
      return s.listBlocked.all(userId).map((r) => r.blocked_user_id);
    },

    // ---------- connections ----------
    createConnectionRequest(requesterId, recipientId, message) {
      const existing = s.getConnectionExact.get(requesterId, recipientId);
      if (existing) return { ...existing, __duplicate: true };
      const info = s.insertConnection.run(requesterId, recipientId, message || null);
      return s.getConnectionById.get(info.lastInsertRowid);
    },
    getConnectionBetween(userA, userB) {
      return s.getConnectionBetween.get(userA, userB, userB, userA) || null;
    },
    getConnectionById(id) {
      return s.getConnectionById.get(id) || null;
    },
    updateConnectionStatus(id, status) {
      s.updateConnectionStatus.run(status, id);
      return s.getConnectionById.get(id);
    },
    reopenConnection(id) { s.reopenConnection.run(id); return s.getConnectionById.get(id); },
    listPendingForUser(userId) {
      return s.listPendingForUser.all(userId);
    },
    listAcceptedConnections(userId) {
      return s.listAcceptedConnections.all(userId, userId);
    },
    countConnections(userId, status) {
      return s.countConnections.get(status, userId, userId).n;
    },

    // ---------- reports ----------
    createReport(reporterId, reportedId, reason) {
      const info = s.insertReport.run(reporterId, reportedId, reason);
      return { id: info.lastInsertRowid, reporter_id: reporterId, reported_id: reportedId, reason };
    },
    countReportsAgainst(userId) {
      return s.countReportsAgainst.get(userId).n;
    },
    listOpenReports() {
      return s.listOpenReports.all();
    },

    // ---------- achievements ----------
    seedAchievements(list) {
      for (const a of list) s.insertAchievement.run(a.key, a.name, a.emoji, a.description);
    },
    listAchievements() {
      return s.listAchievements.all();
    },
    hasAchievement(userId, key) {
      return Boolean(s.hasAchievement.get(userId, key));
    },
    unlockAchievement(userId, key) {
      const info = s.unlockAchievement.run(userId, key);
      return info.changes > 0;
    },
    listUserAchievements(userId) {
      return s.listUserAchievements.all(userId).map((r) => r.achievement_key);
    },

    // ---------- streaks ----------
    getStreak(userId) {
      return (
        s.getStreak.get(userId) || {
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_active_date: null,
        }
      );
    },
    upsertStreak(userId, data) {
      const current = this.getStreak(userId);
      const merged = { ...current, ...data };
      s.upsertStreak.run(userId, merged.current_streak, merged.longest_streak, merged.last_active_date);
      return merged;
    },

    // ---------- notifications ----------
    createNotification(userId, type, payload) {
      const info = s.insertNotification.run(userId, type, JSON.stringify(payload || {}));
      return { id: info.lastInsertRowid, user_id: userId, type, payload };
    },
    listUnreadNotifications(userId) {
      return s.listUnreadNotifications.all(userId).map((n) => ({ ...n, payload: fromJson(n.payload) }));
    },
    listRecentNotifications(userId, limit = 20) {
      return s.listRecentNotifications.all(userId, limit).map((n) => ({ ...n, payload: fromJson(n.payload) }));
    },
    markNotificationsRead(ids) {
      for (const id of ids) db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
    },

    // ---------- analytics ----------
    recordEvent(eventType, userId, meta = {}) {
      s.insertEvent.run(eventType, userId ?? null, JSON.stringify(meta));
    },
    countEventsSince(eventType, sinceIso) {
      return s.countEventsSince.get(eventType, sinceIso).n;
    },
    listEventsSince(eventType, sinceIso) {
      return s.listEventsSince.all(eventType, sinceIso).map((e) => ({ ...e, meta: fromJson(e.meta) }));
    },

    // ---------- rate limiting ----------
    recordRateLimitAction(userId, action) {
      s.insertRateLimitEvent.run(userId, action);
    },
    countRateLimitActionsSince(userId, action, sinceIso) {
      return s.countRateLimitActionsSince.get(userId, action, sinceIso).n;
    },

    // ---------- admin ----------
    createAnnouncement(message, sentBy) {
      const info = s.insertAnnouncement.run(message, sentBy);
      return { id: info.lastInsertRowid, message, sent_by: sentBy };
    },
    listAllUserIds() {
      return s.listAllUserIds.all().map((r) => r.id);
    },
  };
}
