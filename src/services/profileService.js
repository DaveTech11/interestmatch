import { NotFoundError, ValidationError } from '../utils/errors.js';
import { requireString, requireOneOf, sanitizeFreeText } from '../utils/validation.js';
import { buildProfileDeepLink } from '../utils/publicId.js';
import { env } from '../config/env.js';

const PROFILE_MODES = ['public', 'limited', 'invisible'];

export function createProfileService(store, interestCatalogService) {
  return {
    getOrCreateUser(telegramUser) {
      const existing = store.getUserByTelegramId(telegramUser.id);
      if (existing) return existing;
      return store.createUser({
        telegramId: telegramUser.id,
        username: telegramUser.username || null,
        displayName: telegramUser.first_name || telegramUser.username || 'New Explorer',
      });
    },

    getUser(userId) {
      const user = store.getUserById(userId);
      if (!user) throw new NotFoundError('User not found');
      return user;
    },

    updateBasics(userId, { displayName, username, bio, age, country, region, lookingFor, gender, photoFileId }) {
      const patch = {};
      if (displayName !== undefined) patch.display_name = requireString(displayName, 'displayName', { max: 64 });
      if (username !== undefined) patch.username = requireString(username, 'username', { max: 64 }).replace(/^@+/, '').trim();
      if (bio !== undefined) patch.bio = sanitizeFreeText(bio, 300);
      if (age !== undefined) patch.age = age === null ? null : Number(age);
      if (country !== undefined) patch.country = country;
      if (region !== undefined) patch.region = region;
      if (lookingFor !== undefined) patch.looking_for = lookingFor;
      if (gender !== undefined) { requireOneOf(gender, 'gender', ['male', 'female']); patch.gender = gender; }
      if (photoFileId !== undefined) patch.photo_file_id = photoFileId;
      return store.updateUser(userId, patch);
    },

    setLanguages(userId, languages) {
      return store.updateUser(userId, { languages });
    },
    setGoals(userId, goals) {
      return store.updateUser(userId, { goals });
    },
    setSkills(userId, skills) {
      return store.updateUser(userId, { skills });
    },
    setInterests(userId, interestIds) {
      store.setUserInterests(userId, interestIds);
      return interestIds;
    },
    completeOnboarding(userId) {
      return store.updateUser(userId, { onboarding_complete: 1 });
    },

    setProfileMode(userId, mode) {
      requireOneOf(mode, 'profile mode', PROFILE_MODES);
      return store.updateUser(userId, { profile_mode: mode });
    },

    /** Builds the full profile object the matching engine scores against. */
    buildMatchProfile(userId) {
      const user = store.getUserById(userId);
      if (!user) return null;
      return {
        userId: user.id,
        interests: store.getUserInterests(user.id),
        skills: user.skills || [],
        languages: user.languages || [],
        goals: user.goals || [],
        communities: store.getUserInterests(user.id), // communities == interest membership in v1.5
        region: user.region,
      };
    },

    /**
     * Renders what viewer is allowed to see of target's profile, honoring
     * privacy settings and profile mode. Never leaks the internal DB id —
     * only the public_id is exposed for deep links.
     */
    renderPublicProfile(targetUserId, { forViewer = null } = {}) {
      const user = store.getUserById(targetUserId);
      if (!user) throw new NotFoundError('Profile not found');
      const privacy = store.getPrivacySettings(targetUserId);
      const interests = store.getUserInterests(targetUserId).map((id) => interestCatalogService.getInterest(id));

      const limited = user.profile_mode === 'limited';

      return {
        publicId: user.public_id,
        displayName: user.display_name,
        bio: user.bio,
        age: privacy.show_age && !limited ? user.age : null,
        country: privacy.show_country && !limited ? user.country : null,
        interests: privacy.show_interests ? interests.filter(Boolean).slice(0, limited ? 3 : 50) : [],
        lookingFor: user.looking_for,
        gender: user.gender || null,
        photoFileId: user.photo_file_id || null,
        photos: store.listProfilePhotos ? store.listProfilePhotos(user.id) : (user.photo_file_id ? [user.photo_file_id] : []),
        verified: Boolean(user.verified),
        online: Boolean(user.last_active_at && Date.now() - new Date(user.last_active_at).getTime() < 5 * 60 * 1000),
        vip: Boolean(user.vip_until && new Date(user.vip_until).getTime() > Date.now()) || user.plan_tier !== 'free',
        deepLink: buildProfileDeepLink(env.botPublicUsername, user.public_id),
        canView: privacy.allow_profile_views,
        canConnect: privacy.allow_connections,
        isSelf: forViewer === targetUserId,
      };
    },

    deleteAllData(userId) {
      return store.deleteUserData(userId);
    },
  };
}

export { PROFILE_MODES };
