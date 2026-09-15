import { ForbiddenError, ValidationError } from '../utils/errors.js';

export function createAdvancedMatchService({ store, discoveryService, profileService, connectionService, notificationService }) {
  const isVip = (user) => Boolean(user?.plan_tier && user.plan_tier !== 'free') || Boolean(user?.vip_until && new Date(user.vip_until).getTime() > Date.now());

  async function likedYou(userId, limit = 20) {
    const rows = store.listLikedYou(userId, limit);
    return rows.map((row) => ({ ...row, user: store.getUserById(row.user_id), profile: profileService.renderPublicProfile(row.user_id, { forViewer: userId }) })).filter((x) => x.user);
  }

  function rewind(userId) {
    const passes = store.listRecentPasses(userId, 10);
    if (!passes.length) return null;
    const latest = passes[0];
    if (!store.rewindPass(userId, latest.passed_user_id)) return null;
    return store.getUserById(latest.passed_user_id);
  }

  async function compatibility(userId, targetUserId) {
    const ranked = await discoveryService.discover(userId, { limit: 100 });
    return ranked.find((r) => r.user.id === targetUserId) || null;
  }

  function vipInfo(userId) {
    const user = store.getUserById(userId);
    return { active: isVip(user), tier: user?.plan_tier || 'free', until: user?.vip_until || null };
  }

  function requireVip(userId) {
    if (!isVip(store.getUserById(userId))) throw new ForbiddenError('This feature is available to VIP members.');
  }

  async function requestWithSuperLike(userId, targetUserId) {
    const user = store.getUserById(userId);
    if (!isVip(user)) throw new ForbiddenError('Super Likes require VIP.');
    if (!discoveryService.isGenderCompatible(userId, targetUserId)) throw new ValidationError('This profile is not compatible with your gender preference.');
    return connectionService.sendRequest(userId, targetUserId, '⭐ sᴜᴘᴇʀ ʟɪᴋᴇ');
  }

  return { isVip, likedYou, rewind, compatibility, vipInfo, requireVip, requestWithSuperLike };
}
