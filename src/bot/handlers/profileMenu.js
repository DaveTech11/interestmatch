import { statsScreen, interestDnaScreen, matchHistoryScreen, profileActivityScreen, savedListScreen, trendingScreen, header, deleteAllDataConfirmScreen, customMatchScreen } from '../ui/templates.js';
import { mainMenuKeyboard, nearbyToggleKeyboard, categoriesKeyboard, communityListKeyboard, privacyMenuKeyboard, confirmDeleteKeyboard, profileModeKeyboard, searchInterestKeyboard, searchMinScoreKeyboard, backButton, customMatchKeyboard } from '../ui/keyboards.js';
import { computeInterestDna } from '../../domain/scoring.js';
import { getSession, clearAwaiting } from '../session.js';

const PRIVACY_LABELS = { show_age:'sʜᴏᴡ ᴀɢᴇ', show_country:'sʜᴏᴡ ᴄᴏᴜɴᴛʀʏ', show_interests:'sʜᴏᴡ ɪɴᴛᴇʀᴇsᴛs', allow_profile_views:'ᴀʟʟᴏᴡ ᴘʀᴏғɪʟᴇ ᴠɪᴇᴡs', allow_connections:'ᴀʟʟᴏᴡ ᴄᴏɴɴᴇᴄᴛɪᴏɴs', appear_in_discovery:'ᴀᴘᴘᴇᴀʀ ɪɴ ᴅɪsᴄᴏᴠᴇʀʏ', receive_recommendations:'ʀᴇᴄᴇɪᴠᴇ ʀᴇᴄᴏᴍᴍᴇɴᴅᴀᴛɪᴏɴs' };

export function createProfileMenuHandlers({ telegram, store, profileService, privacyService, statsService, discoveryService, trendingService, communityService, interestCatalogService, discoveryHandlers }) {
  discoveryHandlers.bindCommunityLookup((interestId) => communityService.getCommunity(interestId));
  async function showStats(chatId, user) { await telegram.sendMessage(chatId, statsScreen(statsService.getUserStats(user.id)), { replyMarkup: backButton() }); }
  async function showHistory(chatId, user) { await telegram.sendMessage(chatId, matchHistoryScreen(store.listMatchHistory(user.id, 30)), { replyMarkup: backButton() }); }
  async function showNearby(chatId, user) { const pref = store.getMatchPreferences(user.id); await telegram.sendMessage(chatId, `🌎 ɴᴇᴀʀʙʏ ᴍᴀᴛᴄʜɪɴɢ\n\nᴍᴀᴛᴄʜᴇs ᴡɪʟʟ ʙᴇ ʟɪᴍɪᴛᴇᴅ ᴛᴏ ʏᴏᴜʀ ᴄᴏᴜɴᴛʀʏ ᴡʜᴇɴ ᴛʜɪs ɪs ᴏɴ.`, { replyMarkup: nearbyToggleKeyboard(Boolean(pref.nearby_only)) }); }
  async function showDna(chatId, user) { const ids = store.getUserInterests(user.id); const dna = computeInterestDna(ids, interestCatalogService.listInterests()); if (!dna.length) return telegram.sendMessage(chatId, '🧬 ᴀᴅᴅ sᴏᴍᴇ ɪɴᴛᴇʀᴇsᴛs ғɪʀsᴛ.', { replyMarkup: backButton() }); await telegram.sendMessage(chatId, interestDnaScreen(dna), { replyMarkup: backButton() }); }
  async function showActivity(chatId, user) { await telegram.sendMessage(chatId, profileActivityScreen(discoveryService.getProfileActivity(user.id)), { replyMarkup: backButton() }); }
  async function showSaved(chatId, user) { const saved = discoveryService.listSaved(user.id).map((p) => ({ displayName:p.display_name, score:'—' })); await telegram.sendMessage(chatId, savedListScreen(saved), { replyMarkup: backButton() }); }
  async function showTrending(chatId) { await telegram.sendMessage(chatId, trendingScreen(trendingService.getTrending(7, 8)), { replyMarkup: backButton() }); }
  async function showCommunityCategories(chatId) { await telegram.sendMessage(chatId, `${header('🌎 ᴄᴏᴍᴍᴜɴɪᴛɪᴇs')}\nᴘɪᴄᴋ ᴀ ᴄᴀᴛᴇɢᴏʀʏ:`, { replyMarkup: categoriesKeyboard(interestCatalogService.listCategories(), 'browsecat') }); }
  async function showCommunityList(chatId, categoryId) { await telegram.sendMessage(chatId, 'ᴄᴏᴍᴍᴜɴɪᴛɪᴇs ɪɴ ᴛʜɪs ᴄᴀᴛᴇɢᴏʀʏ:', { replyMarkup: communityListKeyboard(interestCatalogService.listInterests(categoryId), categoryId) }); }
  async function showProfile(chatId, user) {
    const fresh = profileService.getUser(user.id); const interestIds = store.getUserInterests(user.id); const interests = interestIds.map((id) => interestCatalogService.getInterest(id)).filter(Boolean);
    const text = `${header('👤 ᴍʏ ᴘʀᴏғɪʟᴇ')}\n${fresh.display_name}${fresh.age ? `, ${fresh.age}` : ''}\n${fresh.gender ? `👤 ${fresh.gender === 'male' ? 'ʙᴏʏ' : 'ɢɪʀʟ'}\n` : ''}${fresh.country || ''}${fresh.bio ? `\n💬 ${fresh.bio}` : ''}${interests.length ? `\n\n❤️ ${interests.map((i) => `${i.emoji} ${i.name}`).join(' · ')}` : ''}`;
    if (fresh.photo_file_id) await telegram.sendPhoto(chatId, fresh.photo_file_id, text, { replyMarkup: { inline_keyboard: [[{text:'👤 ᴅɪsᴄᴏᴠᴇʀʏ sᴛᴀᴛᴜs',callback_data:'menu:profilemode',style:'primary'}],[{text:'⬅️ ʙᴀᴄᴋ',callback_data:'menu:main'}]] } });
    else await telegram.sendMessage(chatId, text, { replyMarkup: { inline_keyboard: [[{text:'👤 ᴅɪsᴄᴏᴠᴇʀʏ sᴛᴀᴛᴜs',callback_data:'menu:profilemode',style:'primary'}],[{text:'⬅️ ʙᴀᴄᴋ',callback_data:'menu:main'}]] } });
  }
  async function showProfileMode(chatId, user) { await telegram.sendMessage(chatId, `👤 ᴅɪsᴄᴏᴠᴇʀʏ sᴛᴀᴛᴜs\n\nᴄᴜʀʀᴇɴᴛ: ${profileService.getUser(user.id).profile_mode}`, { replyMarkup: profileModeKeyboard(profileService.getUser(user.id).profile_mode) }); }
  async function setProfileMode(chatId, user, mode) { profileService.setProfileMode(user.id, mode); await telegram.sendMessage(chatId, '✅ ᴅɪsᴄᴏᴠᴇʀʏ sᴛᴀᴛᴜs ᴜᴘᴅᴀᴛᴇᴅ.', { replyMarkup: mainMenuKeyboard() }); }
  async function showPrivacy(chatId, user) { await telegram.sendMessage(chatId, `${header('🕶️ ᴘʀɪᴠᴀᴄʏ')}\nᴛᴀᴘ ᴛᴏ ᴛᴏɢɢʟᴇ:`, { replyMarkup: privacyMenuKeyboard(privacyService.getSettings(user.id), PRIVACY_LABELS) }); }
  async function togglePrivacy(chatId, user, field) { privacyService.toggle(user.id, field); await showPrivacy(chatId, user); }
  async function confirmDelete(chatId) { await telegram.sendMessage(chatId, deleteAllDataConfirmScreen(), { replyMarkup: confirmDeleteKeyboard() }); }
  async function performDelete(chatId, user) { privacyService.deleteAllData(user.id); await telegram.sendMessage(chatId, '🗑️ ᴅᴀᴛᴀ ᴅᴇʟᴇᴛᴇᴅ. sᴇɴᴅ /start ᴛᴏ ʙᴇɢɪɴ ᴀɢᴀɪɴ.'); }
  async function startSearch(chatId) { await telegram.sendMessage(chatId, `${header('🔎 ғɪɴᴅ ᴘᴇᴏᴘʟᴇ')}\nᴄʜᴏᴏsᴇ ᴀ ᴄᴀᴛᴇɢᴏʀʏ ᴏʀ ᴜsᴇ ᴄᴜsᴛᴏᴍ ᴍᴀᴛᴄʜ.`, { replyMarkup: categoriesKeyboard(interestCatalogService.listCategories(), 'searchcat', 'menu:main') }); await telegram.sendMessage(chatId, '✍️ ᴡᴀɴᴛ sᴏᴍᴇᴛʜɪɴɢ sᴘᴇᴄɪғɪᴄ?', { replyMarkup: customMatchKeyboard() }); }
  async function showSearchInterests(chatId, categoryId) { await telegram.sendMessage(chatId, 'ᴘɪᴄᴋ ᴀɴ ɪɴᴛᴇʀᴇsᴛ:', { replyMarkup: searchInterestKeyboard(interestCatalogService.listInterests(categoryId)) }); }
  async function chooseSearchInterest(chatId, telegramId, interestId) { getSession(telegramId).context.searchFilters = { interest: interestId === 'skip' ? undefined : interestId }; await telegram.sendMessage(chatId, 'ᴍɪɴɪᴍᴜᴍ ᴍᴀᴛᴄʜ sᴄᴏʀᴇ?', { replyMarkup: searchMinScoreKeyboard() }); }
  async function runSearch(chatId, user, minScore) { const session = getSession(user.telegram_id); const filters = { ...(session.context.searchFilters || {}), minScore:Number(minScore)||0 }; clearAwaiting(user.telegram_id); await discoveryHandlers.runDiscovery(chatId, user, 'best_match', filters); }
  async function startCustomMatch(chatId, telegramId) { getSession(telegramId).awaiting = 'custom_match'; await telegram.sendMessage(chatId, customMatchScreen(), { replyMarkup: customMatchKeyboard() }); }
  async function handleCustomMatchText(chatId, user, text) { const session = getSession(user.telegram_id); if (session.awaiting !== 'custom_match') return false; clearAwaiting(user.telegram_id); await discoveryHandlers.runCustomDiscovery(chatId, user, text.trim()); return true; }
  return { showStats, showHistory, showNearby, showDna, showActivity, showSaved, showTrending, showCommunityCategories, showCommunityList, showProfile, showProfileMode, setProfileMode, showPrivacy, togglePrivacy, confirmDelete, performDelete, startSearch, showSearchInterests, chooseSearchInterest, runSearch, startCustomMatch, handleCustomMatchText };
}
