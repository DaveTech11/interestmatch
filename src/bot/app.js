import { env, assertRequiredEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getDb, runMigrations } from '../db/connection.js';
import { createSqliteStore } from '../repositories/sqlite/store.js';
import { createTelegramClient } from '../telegram/client.js';
import { startPolling } from '../telegram/polling.js';
import { parseStartPayload } from '../utils/publicId.js';
import { getSession } from './session.js';

import { createInterestCatalogService } from '../services/interestCatalogService.js';
import { createProfileService } from '../services/profileService.js';
import { createPrivacyService } from '../services/privacyService.js';
import { createNotificationService } from '../services/notificationService.js';
import { createRateLimiter } from '../services/rateLimiter.js';
import { createTrustService } from '../services/trustService.js';
import { createAnalyticsService } from '../services/analyticsService.js';
import { createAdminService } from '../services/adminService.js';
import { createAchievementService } from '../services/achievementService.js';
import { createStreakService } from '../services/streakService.js';
import { createStatsService } from '../services/statsService.js';
import { createTrendingService } from '../services/trendingService.js';
import { createCommunityService } from '../services/communityService.js';
import { createIcebreakerService } from '../services/icebreakerService.js';
import { createConnectionService } from '../services/connectionService.js';
import { createDiscoveryService } from '../services/discoveryService.js';
import { createMatchService } from '../services/matchService.js';
import { createAdvancedMatchService } from '../services/advancedMatchService.js';
import { createPerfectMatchService } from '../services/perfectMatchService.js';
import { createTrendingModesService } from '../services/trendingModesService.js';
import { mutualMatchScreen } from './ui/templates.js';
import { DeterministicRecommendationProvider } from '../domain/matching/recommendationProvider.js';
import { CATEGORIES, INTERESTS } from '../domain/interestCatalogData.js';
import { createServer } from 'node:http';

import { createOnboardingHandlers } from './handlers/onboarding.js';
import { createDiscoveryHandlers } from './handlers/discovery.js';
import { createConnectionHandlers } from './handlers/connections.js';
import { createProfileMenuHandlers } from './handlers/profileMenu.js';
import { createAdminHandlers } from './handlers/admin.js';
import { createAdvancedHandlers } from './handlers/advanced.js';
import { createPerfectMatchHandlers } from './handlers/perfectMatch.js';
import { header, achievementUnlockedScreen, streakScreen, newConnectionRequestScreen, menuCaption, profileBlock, newMemberScreen } from './ui/templates.js';
import { mainMenuKeyboard, matchTypesKeyboard, connectionRequestKeyboard, newMemberKeyboard, trendingModesKeyboard, nearbyToggleKeyboard, reportReasonsKeyboard } from './ui/keyboards.js';

export async function buildApplication() {
  assertRequiredEnv();

  const db = getDb();
  runMigrations(db);
  // Render/production must not depend on a separate one-off seed command.
  // Keep the interest catalog available after every fresh deployment.
  const insertCategory = db.prepare(`INSERT INTO interest_categories (id, name, emoji, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, sort_order=excluded.sort_order`);
  const insertInterest = db.prepare(`INSERT INTO interests (id, name, emoji, category_id, active) VALUES (?, ?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, emoji=excluded.emoji, category_id=excluded.category_id, active=1`);
  db.exec('BEGIN');
  try {
    for (const category of CATEGORIES) insertCategory.run(category.id, category.name, category.emoji, category.sort_order);
    for (const interest of INTERESTS) insertInterest.run(interest.id, interest.name, interest.emoji, interest.category_id);
    db.exec('COMMIT');
  } catch (seedError) {
    db.exec('ROLLBACK');
    throw seedError;
  }
  const store = createSqliteStore(db);

  const telegram = createTelegramClient(env.botToken);

  const analyticsService = createAnalyticsService(store);
  const interestCatalogService = createInterestCatalogService(store);
  const profileService = createProfileService(store, interestCatalogService);
  const privacyService = createPrivacyService(store);
  const notificationService = createNotificationService(store);
  const rateLimiter = createRateLimiter(store);
  const trustService = createTrustService(store);
  const adminService = createAdminService({
    store,
    analyticsService,
    broadcast: (chatId, text) => telegram.sendMessage(chatId, text),
  });
  const achievementService = createAchievementService({ store, interestCatalogService, notificationService, analyticsService });
  achievementService.ensureSeeded();
  const streakService = createStreakService({ store, achievementService, notificationService });
  const statsService = createStatsService({ store, analyticsService, achievementService, streakService });
  const trendingService = createTrendingService(analyticsService, interestCatalogService);
  const communityService = createCommunityService(store, interestCatalogService);
  const icebreakerService = createIcebreakerService(interestCatalogService);
  const connectionService = createConnectionService({ store, rateLimiter, notificationService, analyticsService });
  const recommendationProvider = new DeterministicRecommendationProvider();
  const discoveryService = createDiscoveryService({
    store,
    profileService,
    interestCatalogService,
    recommendationProvider,
    trustService,
    analyticsService,
    getWeights: () => adminService.getCurrentWeights(),
  });

  const onboardingHandlers = createOnboardingHandlers({ telegram, profileService, interestCatalogService, achievementService, menuImageUrl: env.menuImageUrl });
  const matchService = createMatchService({ store, discoveryService, connectionService, notificationService, analyticsService, profileService });
  const advancedMatchService = createAdvancedMatchService({ store, discoveryService, profileService, connectionService, notificationService });
  const perfectMatchService = createPerfectMatchService({ store, discoveryService, interestCatalogService });
  const trendingModesService = createTrendingModesService({ store, discoveryService, analyticsService, profileService });

  const discoveryHandlers = createDiscoveryHandlers({
    telegram,
    discoveryService,
    connectionService,
    streakService,
    achievementService,
    profileService,
  });
  const connectionHandlers = createConnectionHandlers({
    telegram,
    connectionService,
    achievementService,
    icebreakerService,
    interestCatalogService,
    store,
    profileService,
  });
  const matchHandlers = (await import('./handlers/match.js')).createMatchHandlers({ telegram, matchService, profileService, connectionService, store, advancedMatchService });

  const profileMenuHandlers = createProfileMenuHandlers({
    telegram,
    store,
    profileService,
    privacyService,
    statsService,
    discoveryService,
    trendingService,
    communityService,
    interestCatalogService,
    discoveryHandlers,
  });
  const adminHandlers = createAdminHandlers({ telegram, adminService });
  const advancedHandlers = createAdvancedHandlers({ telegram, advancedMatchService, profileService, store });
  const perfectMatchHandlers = createPerfectMatchHandlers({ telegram, perfectMatchService, store, interestCatalogService, discoveryHandlers, profileService });

  // ---- real-time notification pushes ----
  notificationService.onPush(async ({ userId, type, payload }) => {
    try {
      const user = store.getUserById(userId);
      if (!user) return;
      const chatId = user.telegram_id;
      switch (type) {
        case 'new_connection_request': {
          const from = store.getUserById(payload.fromUserId);
          if (!from) break;
          const profile = profileService.renderPublicProfile(from.id, { forViewer: userId });
          const caption = newConnectionRequestScreen(from.display_name, payload.message) + `\n\n${profileBlock(profile)}`;
          if (profile.photoFileId) {
            const sent = await telegram.sendPhoto(chatId, profile.photoFileId, caption, { replyMarkup: connectionRequestKeyboard(payload.connectionId) });
            if (!sent?.ok) await telegram.sendMessage(chatId, caption, { replyMarkup: connectionRequestKeyboard(payload.connectionId) });
          } else {
            await telegram.sendMessage(chatId, caption, { replyMarkup: connectionRequestKeyboard(payload.connectionId) });
          }
          break;
        }
        case 'achievement_unlocked': {
          const def = achievementService.listCatalog().find((a) => a.key === payload.key);
          if (def) await telegram.sendMessage(chatId, achievementUnlockedScreen(def.emoji, def.name, def.description));
          break;
        }
        case 'streak_milestone':
          await telegram.sendMessage(chatId, streakScreen(payload.streak, payload.xp));
          break;
        case 'new_like': {
          const from = store.getUserById(payload.fromUserId); if (!from) break;
          const profile = profileService.renderPublicProfile(from.id, { forViewer: userId });
          const caption = `${payload.superLike ? '⭐ sᴜᴘᴇʀ ʟɪᴋᴇ!' : '💚 sᴏᴍᴇᴏɴᴇ ʟɪᴋᴇᴅ ʏᴏᴜ!'}\n\n${profileBlock(profile)}`;
          await telegram.sendMessage(chatId, caption, { replyMarkup: { inline_keyboard: [[{ text: '💚 ʟɪᴋᴇ ʙᴀᴄᴋ', callback_data: `like:${from.id}`, style: 'success' }],[{ text: '👤 ᴠɪᴇᴡ ᴘʀᴏғɪʟᴇ', callback_data: `view:${from.id}`, style: 'primary' }]] } });
          break;
        }
        case 'mutual_match': {
          const other = store.getUserById(payload.otherUserId); if (!other) break;
          const profile = profileService.renderPublicProfile(other.id, { forViewer: userId });
          await telegram.sendMessage(chatId, mutualMatchScreen(profile, payload.superLike), { replyMarkup: { inline_keyboard: [[{ text: '💬 ᴍᴇssᴀɢᴇ', callback_data: `message:${payload.connectionId}`, style: 'success' }],[{ text: '👤 ᴘʀᴏғɪʟᴇ', callback_data: `connectionprofile:${payload.connectionId}`, style: 'primary' }]] } });
          break;
        }
        // 'connection_accepted' is handled directly by connectionHandlers.respond()
        // with the richer icebreaker screen, so no duplicate push here.
        default:
          break;
      }
    } catch (err) {
      // A failed push must never take down the polling loop or the process —
      // log it and move on.
      logger.error('notification push failed', err);
    }
  });

  async function sendMenu(chatId) {
    const markup = mainMenuKeyboard();
    const sent = await telegram.sendPhoto(chatId, env.menuImageUrl, menuCaption(), { replyMarkup: markup });
    if (!sent?.ok) await telegram.sendMessage(chatId, `${header()}\n${menuCaption()}`, { replyMarkup: markup });
  }

  async function syncProfilePhoto(user) {
    const result = await telegram.getUserProfilePhotos(user.telegram_id, 5);
    const photos = result?.ok ? (result.result?.photos || []).map((sizes) => sizes?.at(-1)?.file_id).filter(Boolean) : [];
    photos.forEach((fileId, index) => store.addProfilePhoto?.(user.id, fileId, index));
    if (!user.photo_file_id && photos[0]) return profileService.updateBasics(user.id, { photoFileId: photos[0] });
    return user;
  }

  async function announceNewMember(newUser) {
    const profile = profileService.renderPublicProfile(newUser.id);
    const users = store.listAllUsers().filter((u) => u.id !== newUser.id && u.onboarding_complete);
    let sent = 0;
    for (const recipient of users) {
      try {
        const matchResults = await discoveryService.discover(recipient.id, { limit: 100 });
        const match = matchResults.find((r) => r.user.id === newUser.id);
        if (!match) continue;
        const caption = newMemberScreen(profile, match.score);
        if (profile.photoFileId) {
          const result = await telegram.sendPhoto(recipient.telegram_id, profile.photoFileId, caption, { replyMarkup: newMemberKeyboard(newUser.id) });
          if (!result?.ok) await telegram.sendMessage(recipient.telegram_id, caption, { replyMarkup: newMemberKeyboard(newUser.id) });
        } else await telegram.sendMessage(recipient.telegram_id, caption, { replyMarkup: newMemberKeyboard(newUser.id) });
        sent++;
      } catch (err) { logger.warn('new member alert failed', { recipientId: recipient.id, error: err?.message }); }
    }
    logger.info('new member alerts sent', { userId: newUser.id, sent });
  }

  function getUserFromUpdate(from) {
    return profileService.getOrCreateUser(from);
  }

  async function ensureOnboarded(chatId, user) {
    if (!user.onboarding_complete) {
      await onboardingHandlers.begin(chatId, user);
      return false;
    }
    return true;
  }

  async function handleCommand(chatId, user, text) {
    const [command, ...rest] = text.trim().split(/\s+/);
    const arg = rest.join(' ');
    switch (command) {
      case '/start': {
        await syncProfilePhoto(user);
        if (!(await ensureOnboarded(chatId, user))) return;
        const payload = parseStartPayload(arg);
        if (payload?.type === 'profile') {
          const target = store.getUserByPublicId(payload.publicId);
          if (target) {
            await discoveryHandlers.view(chatId, user, target.id);
            return;
          }
        }
        await sendMenu(chatId);
        return;
      }
      case '/menu':
        await sendMenu(chatId);
        return;
      case '/discover':
        if (!(await ensureOnboarded(chatId, user))) return;
        await discoveryHandlers.runDiscovery(chatId, user, 'best_match');
        return;
      case '/stats':
        if (!(await ensureOnboarded(chatId, user))) return;
        await profileMenuHandlers.showStats(chatId, user);
        return;
      case '/history':
        if (!(await ensureOnboarded(chatId, user))) return;
        await profileMenuHandlers.showHistory(chatId, user);
        return;
      case '/liked':
        if (!(await ensureOnboarded(chatId, user))) return;
        await advancedHandlers.likedYou(chatId, user);
        return;
      case '/rewind':
        if (!(await ensureOnboarded(chatId, user))) return;
        await advancedHandlers.rewind(chatId, user);
        return;
      case '/vip':
        await advancedHandlers.vip(chatId, user);
        return;
      case '/matchprefs':
        await matchHandlers.startPreferences(chatId, user);
        return;
      case '/perfect':
        if (!(await ensureOnboarded(chatId, user))) return;
        await perfectMatchHandlers.start(chatId, user);
        return;
      case '/endchat':
        await connectionHandlers.endChat(chatId, user);
        return;
      case '/admin':
        await adminHandlers.showSnapshot(chatId, user.telegram_id);
        return;
      case '/reports':
        await adminHandlers.reports(chatId, user.telegram_id);
        return;
      case '/announce':
        await adminHandlers.startAnnouncement(chatId, user.telegram_id);
        return;
      case '/help':
      default:
        await telegram.sendMessage(
          chatId,
          `${header('❓ HELP')}\n` +
            `/start – open InterestMatch\n` +
            `/discover – find people\n` +
            `/stats – your dashboard\n` +
            `/menu – main menu\n` +
            `/matchprefs – edit match age range\n` +
            `/perfect – find your top 5 match\n` +
            `/history – match activity history\n` +
            `/endchat – leave an active chat relay`
        );
    }
  }

  async function handleCallback(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const user = getUserFromUpdate(callbackQuery.from);
    const data = callbackQuery.data || '';
    const [action, ...parts] = data.split(':');

    try {
      switch (action) {
        case 'perfect':
          if (parts[0] === 'start') await perfectMatchHandlers.start(chatId, user);
          else if (parts[0] === 'cancel') await perfectMatchHandlers.cancel(chatId, user);
          else if (parts[0] === 'view') await perfectMatchHandlers.view(chatId, user, parts[1]);
          break;
        case 'trendingmode': {
          const results = await trendingModesService.get(user.id, parts[0], 15);
          const s = getSession(user.telegram_id); s.queue = results; s.context.queueIndex = 0; s.context.matchType = 'best_match';
          await discoveryHandlers.showCurrentCard(chatId, user);
          break;
        }
        case 'nearby':
          if (parts[0] === 'toggle') { const pref = store.getMatchPreferences(user.id); const next = !Boolean(pref.nearby_only); store.updateMatchPreferences(user.id, { nearby_only: next }); await telegram.sendMessage(chatId, `🌎 ɴᴇᴀʀʙʏ ᴍᴏᴅᴇ ${next ? 'ᴇɴᴀʙʟᴇᴅ' : 'ᴅɪsᴀʙʟᴇᴅ'}.`, { replyMarkup: nearbyToggleKeyboard(next) }); }
          break;
        case 'reportreason':
          await discoveryHandlers.reportWithReason(chatId, user, Number(parts[0]), parts[1]);
          break;
        case 'menu': {
          const target = parts[0];
          if (target === 'main') await sendMenu(chatId);
          else if (target === 'match_types') await telegram.sendMessage(chatId, '🎯 Choose a discovery lane:', { replyMarkup: matchTypesKeyboard() });
          else if (target === 'perfect_match') { if (await ensureOnboarded(chatId, user)) await perfectMatchHandlers.start(chatId, user); }
          else if (target === 'communities') await profileMenuHandlers.showCommunityCategories(chatId);
          else if (target === 'search') await profileMenuHandlers.startSearch(chatId);
          else if (target === 'saved') await profileMenuHandlers.showSaved(chatId, user);
          else if (target === 'stats') await profileMenuHandlers.showStats(chatId, user);
          else if (target === 'dna') await profileMenuHandlers.showDna(chatId, user);
          else if (target === 'trending') await profileMenuHandlers.showTrending(chatId);
          else if (target === 'trending_people') await telegram.sendMessage(chatId, '🔥 ᴛʀᴇɴᴅɪɴɢ ᴘᴇᴏᴘʟᴇ\n\nᴄʜᴏᴏsᴇ ᴀ ᴛʀᴇɴᴅɪɴɢ ᴍᴏᴅᴇ:', { replyMarkup: trendingModesKeyboard() });
          else if (target === 'custom_match') await profileMenuHandlers.startCustomMatch(chatId, user.telegram_id);
          else if (target === 'quick_match') await matchHandlers.quick(chatId, user);
          else if (target === 'daily_match') await matchHandlers.daily(chatId, user);
          else if (target === 'liked_you') await advancedHandlers.likedYou(chatId, user);
          else if (target === 'rewind') await advancedHandlers.rewind(chatId, user);
          else if (target === 'vip') await advancedHandlers.vip(chatId, user);
          else if (target === 'match_preferences') await matchHandlers.startPreferences(chatId, user);
          else if (target === 'activity') await profileMenuHandlers.showActivity(chatId, user);
          else if (target === 'history') await profileMenuHandlers.showHistory(chatId, user);
          else if (target === 'nearby') await profileMenuHandlers.showNearby(chatId, user);
          else if (target === 'profile') await profileMenuHandlers.showProfile(chatId, user);
          else if (target === 'privacy') await profileMenuHandlers.showPrivacy(chatId, user);
          else if (target === 'profilemode') await profileMenuHandlers.showProfileMode(chatId, user);
          break;
        }
        case 'like':
          await matchHandlers.like(chatId, user, Number(parts[0]), false);
          break;
        case 'superlike':
          await matchHandlers.like(chatId, user, Number(parts[0]), true);
          break;
        case 'pass':
          await matchHandlers.pass(chatId, user, Number(parts[0]));
          break;
        case 'dailylike':
          await matchHandlers.dailyLike(chatId, user, Number(parts[0]));
          break;
        case 'dailypass':
          await matchHandlers.dailyPass(chatId, user, Number(parts[0]));
          break;
        case 'quicknext':
          await matchHandlers.pass(chatId, user, Number(parts[2]));
          break;
        case 'discover':
          if (!(await ensureOnboarded(chatId, user))) return;
          await discoveryHandlers.runDiscovery(chatId, user, parts[0] || 'best_match');
          break;
        case 'next':
          await discoveryHandlers.advance(chatId, user);
          break;
        case 'skip':
          await discoveryHandlers.skip(chatId, user, Number(parts[1]));
          break;
        case 'hide':
          await discoveryHandlers.hide(chatId, user, Number(parts[0]));
          break;
        case 'block':
          await discoveryHandlers.block(chatId, user, Number(parts[0]));
          break;
        case 'report':
          await telegram.sendMessage(chatId, '🚨 ʀᴇᴘᴏʀᴛ ᴘʀᴏғɪʟᴇ', { replyMarkup: reportReasonsKeyboard(Number(parts[0])) });
          break;
        case 'save':
          await discoveryHandlers.save(chatId, user, Number(parts[0]), callbackQuery.id);
          break;
        case 'view':
          await discoveryHandlers.view(chatId, user, Number(parts[0]));
          break;
        case 'interact':
          await discoveryHandlers.interact(chatId, user, Number(parts[0]));
          break;
        case 'friendconnect':
          await discoveryHandlers.friendConnect(chatId, user, Number(parts[0]));
          break;
        case 'friendchat':
          await discoveryHandlers.friendChat(chatId, user, Number(parts[0]));
          break;
        case 'connect':
          await discoveryHandlers.promptConnect(chatId, user, Number(parts[0]));
          break;
        case 'connectreason':
          await discoveryHandlers.connectWithReason(chatId, user, Number(parts[0]), parts[1]);
          break;
        case 'accept':
          await connectionHandlers.respond(chatId, user, Number(parts[0]), true);
          break;
        case 'decline':
          await connectionHandlers.respond(chatId, user, Number(parts[0]), false);
          break;
        case 'message':
          await connectionHandlers.startMessage(chatId, user, Number(parts[0]));
          break;
        case 'reply':
          await connectionHandlers.startReply(chatId, user, Number(parts[0]));
          break;
        case 'connectionprofile':
          await connectionHandlers.connectionProfile(chatId, user, Number(parts[0]));
          break;
        case 'trendingaccept':
          await discoveryHandlers.trendingAccept(chatId, user, Number(parts[0]));
          break;
        case 'trendingskip':
          await discoveryHandlers.trendingSkip(chatId, user, Number(parts[0]));
          break;
        case 'likednext':
          await advancedHandlers.likedNext(chatId, user);
          break;
        case 'likedpass':
          await matchHandlers.pass(chatId, user, Number(parts[0]));
          await advancedHandlers.likedNext(chatId, user);
          break;
        case 'trendingnext':
          await discoveryHandlers.trendingNext(chatId, user);
          break;
        case 'newmember':
          await discoveryHandlers.showCandidate(chatId, user, Number(parts[0]));
          break;
        case 'gender':
          await onboardingHandlers.chooseGender(chatId, user, parts[0]);
          break;
        case 'icebreaker': {
          const connectionId = Number(parts[0]);
          const idx = Number(parts[1]);
          const connection = store.getConnectionById(connectionId);
          if (connection) {
            const otherUserId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;
            const shared = store.getUserInterests(user.id).filter((id) => store.getUserInterests(otherUserId).includes(id));
            const options = icebreakerService.generate(shared);
            await connectionHandlers.sendIcebreaker(chatId, user, connectionId, idx, options);
          }
          break;
        }
        case 'icebreaker_more': {
          const connectionId = Number(parts[0]);
          const connection = store.getConnectionById(connectionId);
          if (connection) {
            const otherUserId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id;
            const shared = store.getUserInterests(user.id).filter((id) => store.getUserInterests(otherUserId).includes(id));
            const options = icebreakerService.generate(shared, 1);
            await telegram.sendMessage(chatId, 'Here are a few more ideas:', {
              replyMarkup: { inline_keyboard: options.map((_, i) => [{ text: 'Send this', callback_data: `icebreaker:${connectionId}:${i}` }]) },
            });
          }
          break;
        }
        case 'toggleinterest':
          await onboardingHandlers.toggleInterest(chatId, messageId, user.telegram_id, parts[0], parts[1]);
          break;
        case 'onboarding':
          if (parts[0] === 'set_account') await onboardingHandlers.startAccountSetup(chatId, user);
          else if (parts[0] === 'requirements') await onboardingHandlers.showRequirements(chatId, user);
          else if (parts[0] === 'continue') await onboardingHandlers.continueSetup(chatId, user);
          else if (parts[0] === 'age') await onboardingHandlers.chooseAge(chatId, user, parts[1]);
          else if (parts[0] === 'age_custom') await onboardingHandlers.askCustomAge(chatId, user);
          else if (parts[0] === 'interests_done') await onboardingHandlers.finishInterests(chatId, user);
          else if (parts[0] === 'categories') await onboardingHandlers.showCategories(chatId);
          else if (parts[0] === 'interests_page') await onboardingHandlers.showInterestPage(chatId, user.telegram_id, parts[1], Number(parts[2]), messageId);
          else if (parts[0] === 'interest_custom') await onboardingHandlers.askCustomInterest(chatId, user.telegram_id, parts[1]);
          break;
        case 'onboardcat':
          await onboardingHandlers.showInterestsForCategory(chatId, user.telegram_id, parts[0]);
          break;
        case 'lookingfor': {
          const wasOnboarded = Boolean(user.onboarding_complete);
          await onboardingHandlers.completeOnboarding(chatId, user, parts[0]);
          if (!wasOnboarded) {
            const fresh = profileService.getUser(user.id);
            await announceNewMember(fresh);
          }
          break;
        }
        case 'browsecat':
          await profileMenuHandlers.showCommunityList(chatId, parts[0]);
          break;
        case 'community':
          await discoveryHandlers.showCommunity(chatId, parts[0]);
          break;
        case 'communitydiscover':
          await discoveryHandlers.discoverWithinCommunity(chatId, user, parts[0]);
          break;
        case 'searchcat':
          await profileMenuHandlers.showSearchInterests(chatId, parts[0]);
          break;
        case 'searchinterest':
          await profileMenuHandlers.chooseSearchInterest(chatId, user.telegram_id, parts[0]);
          break;
        case 'searchscore':
          await profileMenuHandlers.runSearch(chatId, user, parts[0]);
          break;
        case 'adminresolve':
          await adminHandlers.resolveReport(chatId, user.telegram_id, Number(parts[0]));
          break;
        case 'privacy':
          if (parts[0] === 'delete_confirm') await profileMenuHandlers.confirmDelete(chatId);
          else if (parts[0] === 'delete_confirmed') await profileMenuHandlers.performDelete(chatId, user);
          else await profileMenuHandlers.togglePrivacy(chatId, user, parts[0]);
          break;
        case 'profilemode':
          await profileMenuHandlers.setProfileMode(chatId, user, parts[0]);
          break;
        default:
          break;
      }
    } catch (err) {
      logger.error('callback handling error', err);
      await telegram.sendMessage(chatId, `Something went wrong: ${err.message}`);
    }
    await telegram.answerCallbackQuery(callbackQuery.id);
  }

  async function handleTextMessage(message) {
    const chatId = message.chat.id;
    const user = getUserFromUpdate(message.from);
    store.touchUser(user.id);
    const text = message.text || '';

    if (text.startsWith('/')) {
      await handleCommand(chatId, user, text);
      return;
    }

    if (await onboardingHandlers.handleTextStep(chatId, user, text)) return;
    if (await perfectMatchHandlers.handleText(chatId, user, text)) return;
    if (await profileMenuHandlers.handleCustomMatchText(chatId, user, text)) return;
    if (await matchHandlers.handlePreferencesText(chatId, user, text)) return;
    if (await discoveryHandlers.handleConnectMessageText(chatId, user, text)) return;
    if (await adminHandlers.handleAnnouncementText(chatId, user.telegram_id, text)) return;
    if (await connectionHandlers.relayMessage(user, text)) return;

    await telegram.sendMessage(chatId, `Not sure what to do with that — try /menu.`);
  }

  async function onUpdate(update) {
    if (update.message?.photo) {
      const user = getUserFromUpdate(update.message.from);
      if (await onboardingHandlers.handlePhotoStep(update.message.chat.id, user, update.message.photo)) return;
      if (await connectionHandlers.relayMedia(update.message)) return;
      return;
    }
    if (update.message && (update.message.video || update.message.voice || update.message.audio || update.message.document || update.message.sticker || update.message.animation)) {
      store.touchUser(getUserFromUpdate(update.message.from).id);
      if (await connectionHandlers.relayMedia(update.message)) return;
    }
    if (update.message?.text !== undefined) {
      await handleTextMessage(update.message);
    } else if (update.callback_query) {
      await handleCallback(update.callback_query);
    }
  }

  return {
    start() {
      logger.info('InterestMatch bot starting', { env: env.nodeEnv });
      const port = Number(process.env.PORT || 10000);
      const healthServer = createServer((req, res) => {
        if (req.url === '/api/health' || req.url === '/health' || req.url === '/') {
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, service: 'interestmatch', status: 'running' }));
          return;
        }
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      });
      healthServer.listen(port, '0.0.0.0', () => logger.info('health server listening', { port }));
      startPolling(telegram, onUpdate);
    },
    // exported for tests / scripts that want the wired services without polling
    services: {
      store,
      profileService,
      interestCatalogService,
      privacyService,
      discoveryService,
      matchService,
      advancedMatchService,
      perfectMatchService,
      trendingModesService,
      advancedHandlers,
      connectionService,
      achievementService,
      streakService,
      statsService,
      trendingService,
      communityService,
      icebreakerService,
      adminService,
      analyticsService,
      trustService,
      notificationService,
    },
  };
}

/* c8 ignore start */
if (import.meta.url === `file://${process.argv[1]}`) {
  buildApplication()
    .then((app) => app.start())
    .catch((err) => {
      logger.error('failed to start application', err);
      process.exit(1);
    });
}
/* c8 ignore stop */
