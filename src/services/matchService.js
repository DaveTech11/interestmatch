import { ForbiddenError, ValidationError } from '../utils/errors.js';

export function createMatchService({ store, discoveryService, connectionService, notificationService, analyticsService, profileService }) {
  function eligible(userId, targetUserId) {
    if (userId === targetUserId) throw new ValidationError('You cannot match with yourself.');
    if (!discoveryService.isGenderCompatible(userId, targetUserId)) throw new ForbiddenError('This profile does not match your gender preference.');
    const source = profileService.getUser(userId);
    const target = profileService.getUser(targetUserId);
    if ((source.age != null && source.age < 18) || (target.age != null && target.age < 18)) {
      throw new ForbiddenError('Romantic matching is available to members 18+ only.');
    }
    if (!target.onboarding_complete) throw new ValidationError('This profile is not ready for matching yet.');
    const privacy = store.getPrivacySettings(targetUserId);
    if (!privacy?.allow_connections) throw new ForbiddenError('This person is not accepting matches right now.');
    if (store.isBlocked(userId, targetUserId)) throw new ForbiddenError('You cannot match with this person.');
    return target;
  }

  function like(userId, targetUserId, { superLike = false } = {}) {
    const target = eligible(userId, targetUserId);
    const result = store.createLike(userId, targetUserId, superLike);
    store.recordMatchHistory?.(userId, targetUserId, superLike ? 'super_like' : 'like');
    if (result.duplicate) return { ...result, mutual: result.mutual };

    analyticsService.track(superLike ? 'super_like_sent' : 'like_sent', userId, { targetUserId });

    if (result.mutual) {
      let connection = store.getConnectionBetween(userId, targetUserId);
      if (!connection) connection = connectionService.sendRequest(userId, targetUserId, superLike ? '⭐ sᴜᴘᴇ ʟɪᴋᴇ — ᴍᴜᴛᴜᴀʟ ᴍᴀᴛᴄʜ!' : '💚 ᴍᴜᴛᴜᴀʟ ʟɪᴋᴇ');
      if (connection.status === 'declined' && store.reopenConnection) connection = store.reopenConnection(connection.id);
      if (connection.status === 'pending') {
        const responderId = connection.recipient_id === userId ? userId : connection.recipient_id;
        connection = connectionService.respond(connection.id, responderId, true);
      }
      notificationService.notify(targetUserId, 'mutual_match', { otherUserId: userId, connectionId: connection.id, superLike });
      notificationService.notify(userId, 'mutual_match', { otherUserId: targetUserId, connectionId: connection.id, superLike });
      analyticsService.track('mutual_match', userId, { otherUserId: targetUserId });
      return { ...result, mutual: true, connection };
    }

    notificationService.notify(targetUserId, 'new_like', { fromUserId: userId, superLike });
    return { ...result, mutual: false };
  }

  function pass(userId, targetUserId) {
    eligible(userId, targetUserId);
    store.recordPass(userId, targetUserId);
    store.recordMatchHistory?.(userId, targetUserId, 'pass');
    analyticsService.track('profile_passed', userId, { targetUserId });
  }

  async function quickMatch(userId, limit = 15) {
    const ranked = await discoveryService.discover(userId, { matchType: 'best_match', limit: Math.max(limit, 20) });
    return ranked.filter((r) => !store.hasPassed(userId, r.user.id) && !store.hasLike(userId, r.user.id)).slice(0, limit);
  }

  async function dailyMatch(userId) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = store.getDailyMatch(userId, today);
    if (existing) return existing;
    const ranked = await discoveryService.discover(userId, { matchType: 'best_match', limit: 30 });
    const candidate = ranked.find((r) => !store.hasPassed(userId, r.user.id) && !store.hasLike(userId, r.user.id));
    if (!candidate) return null;
    store.saveDailyMatch(userId, candidate.user.id, candidate.score, today);
    analyticsService.track('daily_match_shown', userId, { targetUserId: candidate.user.id, score: candidate.score });
    return store.getDailyMatch(userId, today);
  }

  return { like, pass, quickMatch, dailyMatch };
}
