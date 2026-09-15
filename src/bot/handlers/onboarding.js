import { header, welcomeScreen } from '../ui/templates.js';
import { categoriesKeyboard, interestPickerKeyboard, genderKeyboard } from '../ui/keyboards.js';
import { CATEGORIES, INTERESTS } from '../../domain/interestCatalogData.js';
import { getSession, clearAwaiting } from '../session.js';

const LOOKING_FOR_OPTIONS = [
  ['serious_relationship', '💖 sᴇʀɪᴏᴜs ʀᴇʟᴀᴛɪᴏɴsʜɪᴘ'],
  ['long_term_relationship', '💍 ʟᴏɴɢ-ᴛᴇʀᴍ ʀᴇʟᴀᴛɪᴏɴsʜɪᴘ'],
  ['friendship_first', '🫶 ғʀɪᴇɴᴅsʜɪᴘ ғɪʀsᴛ'],
  ['casual_chat', '💬 ᴄᴀsᴜᴀʟ ᴄʜᴀᴛ'],
  ['getting_to_know', '🌱 ɢᴇᴛᴛɪɴɢ ᴛᴏ ᴋɴᴏᴡ ᴇᴀᴄʜ ᴏᴛʜᴇʀ'],
  ['open_to_anything', '✨ ᴏᴘᴇɴ ᴛᴏ sᴇᴇ ᴡʜᴇʀᴇ ɪᴛ ɢᴏᴇs'],
];

const AGE_OPTIONS = [14, 15, 16, 17, 18, 19];

export function createOnboardingHandlers({ telegram, profileService, interestCatalogService, achievementService, menuImageUrl }) {
  function lookingForKeyboard() { return { inline_keyboard: LOOKING_FOR_OPTIONS.map(([value, label]) => [{ text: label, callback_data: `lookingfor:${value}` }]) }; }

  function setAccountKeyboard() {
    return { inline_keyboard: [[{ text: '✅ sᴇᴛ ᴀᴄᴄᴏᴜɴᴛ', callback_data: 'onboarding:set_account', style: 'success' }]] };
  }

  function ageKeyboard() {
    const rows = [];
    for (let i = 0; i < AGE_OPTIONS.length; i += 2) {
      rows.push(AGE_OPTIONS.slice(i, i + 2).map((age) => ({ text: `🎂 ${age}`, callback_data: `onboarding:age:${age}`, style: 'primary' })));
    }
    rows.push([{ text: '✍️ ᴄᴜsᴛᴏᴍ', callback_data: 'onboarding:age_custom', style: 'success' }]);
    rows.push([{ text: '⬅️ ʙᴀᴄᴋ', callback_data: 'onboarding:requirements', style: 'primary' }]);
    return { inline_keyboard: rows };
  }

  function requirementsKeyboard() {
    return { inline_keyboard: [
      [{ text: '➜ ᴄᴏɴᴛɪɴᴜᴇ', callback_data: 'onboarding:continue', style: 'success' }],
      [{ text: '⬅️ ʙᴀᴄᴋ', callback_data: 'onboarding:set_account', style: 'primary' }],
    ] };
  }

  function requirementsText(user, session) {
    const done = (value) => value ? '✅' : '⬜';
    const selectedAge = session.context.age || user.age;
    return `${header('📋 ᴀᴄᴄᴏᴜɴᴛ ʀᴇǫᴜɪʀᴇᴍᴇɴᴛs')}
` +
      `ᴄᴏᴍᴘʟᴇᴛᴇ ᴛʜᴇsᴇ sᴛᴇᴘs ᴛᴏ ʙᴜɪʟᴅ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ.

` +
      `${done(Boolean(user.username || session.context.username))} ᴜsᴇʀɴᴀᴍᴇ
` +
      `${done(Boolean(selectedAge))} ᴀɢᴇ
` +
      `${done(Boolean(user.gender))} ɢᴇɴᴅᴇʀ
` +
      `${done(Boolean(user.photo_file_id))} ᴘʀᴏғɪʟᴇ ᴘʜᴏᴛᴏ
` +
      `${done(Boolean((session.context.selectedInterests || []).length))} ɪɴᴛᴇʀᴇsᴛs
` +
      `${done(Boolean(user.bio))} ʙɪᴏ
` +
      `${done(Boolean(user.country))} ᴄᴏᴜɴᴛʀʏ
` +
      `${done(Boolean(user.looking_for))} ᴡʜᴀᴛ ʏᴏᴜ'ʀᴇ ʟᴏᴏᴋɪɴɢ ғᴏʀ`;
  }

  async function begin(chatId, user) {
    const session = getSession(user.telegram_id);
    session.context.selectedInterests = profileService.buildMatchProfile(user.id).interests;
    session.awaiting = null;
    await telegram.sendMessage(chatId, welcomeScreen(user.display_name), { replyMarkup: setAccountKeyboard() });
  }

  async function startAccountSetup(chatId, user) {
    const session = getSession(user.telegram_id);
    session.context.selectedInterests = profileService.buildMatchProfile(user.id).interests;
    session.awaiting = 'onboarding_username';
    await telegram.sendMessage(chatId, `${header('👤 sᴇᴛ ʏᴏᴜʀ ᴀᴄᴄᴏᴜɴᴛ')}\n\nᴡʜᴀᴛ ᴜsᴇʀɴᴀᴍᴇ ᴅᴏ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴜsᴇ ᴏɴ ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ?\n\nᴇxᴀᴍᴘʟᴇ: @dave ᴏʀ dave`);
  }

  async function showRequirements(chatId, user) {
    const session = getSession(user.telegram_id);
    await telegram.sendMessage(chatId, requirementsText(user, session), { replyMarkup: requirementsKeyboard() });
  }

  async function showAgePicker(chatId, user) {
    const session = getSession(user.telegram_id);
    session.awaiting = null;
    await telegram.sendMessage(chatId, `${header('🎂 ᴄʜᴏᴏsᴇ ʏᴏᴜʀ ᴀɢᴇ')}\n\nᴛᴀᴘ ʏᴏᴜʀ ᴀɢᴇ ʙᴇʟᴏᴡ. ɪғ ʏᴏᴜʀ ᴀɢᴇ ɪsɴ'ᴛ ʟɪsᴛᴇᴅ, ᴜsᴇ ᴄᴜsᴛᴏᴍ.`, { replyMarkup: ageKeyboard() });
  }

  async function chooseAge(chatId, user, age) {
    const n = Number(age);
    if (!Number.isInteger(n) || n < 13 || n > 120) return;
    profileService.updateBasics(user.id, { age: n });
    getSession(user.telegram_id).context.age = n;
    await telegram.sendMessage(chatId, `🎂 ᴀɢᴇ sᴇᴛ ᴛᴏ ${n}.`);
    await telegram.sendMessage(chatId, requirementsText(profileService.getUser(user.id), getSession(user.telegram_id)), { replyMarkup: requirementsKeyboard() });
  }

  async function askCustomAge(chatId, user) {
    getSession(user.telegram_id).awaiting = 'onboarding_age_custom';
    await telegram.sendMessage(chatId, `✍️ ᴄᴜsᴛᴏᴍ ᴀɢᴇ\n\nᴛʏᴘᴇ ʏᴏᴜʀ ᴀɢᴇ ᴀs ᴀ ɴᴜᴍʙᴇʀ.`);
  }

  async function chooseGender(chatId, user, gender) {
    if (!['male', 'female'].includes(gender)) return;
    profileService.updateBasics(user.id, { gender });
    const session = getSession(user.telegram_id);
    session.awaiting = 'onboarding_photo';
    await telegram.sendMessage(chatId, `📸 ᴘʀᴏғɪʟᴇ ᴘʜᴏᴛᴏ\n\n` +
      `sᴇɴᴅ ᴀ ᴘʜᴏᴛᴏ ғᴏʀ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ, ᴏʀ ᴛʏᴘᴇ "sᴋɪᴘ" ᴛᴏ ᴜsᴇ ʏᴏᴜʀ ᴛᴇʟᴇɢʀᴀᴍ ᴘʀᴏғɪʟᴇ ᴘʜᴏᴛᴏ ɪғ ᴀᴠᴀɪʟᴀʙʟᴇ.`);
  }

  async function handlePhotoStep(chatId, user, photo) {
    const session = getSession(user.telegram_id);
    if (!photo?.length) return false;
    const largest = photo[photo.length - 1];
    if (session.awaiting === 'onboarding_photo') {
      profileService.updateBasics(user.id, { photoFileId: largest.file_id });
      session.awaiting = null;
      await showCategories(chatId);
      return true;
    }
    if (user.onboarding_complete) profileService.updateBasics(user.id, { photoFileId: largest.file_id });
    return false;
  }

  function getCategories() {
    const categories = interestCatalogService.listCategories();
    return categories.length ? categories : CATEGORIES;
  }

  function getInterests(categoryId) {
    const interests = interestCatalogService.listInterests(categoryId);
    return interests.length ? interests : INTERESTS.filter((interest) => interest.category_id === categoryId);
  }

  async function showCategories(chatId) {
    await telegram.sendMessage(chatId, `${header('💞 ᴘɪᴄᴋ ʏᴏᴜʀ ʟᴏᴠᴇ & ʀᴇʟᴀᴛɪᴏɴsʜɪᴘ ɪɴᴛᴇʀᴇsᴛs')}\n\nᴄʜᴏᴏsᴇ ᴡʜᴀᴛ ᴍᴀᴛᴛᴇʀs ᴛᴏ ʏᴏᴜ ɪɴ ᴀ ᴄᴏɴɴᴇᴄᴛɪᴏɴ. ᴘɪᴄᴋ ᴍᴜʟᴛɪᴘʟᴇ.`, { replyMarkup: categoriesKeyboard(getCategories(), 'onboardcat', 'onboarding:categories') });
  }

  async function showInterestsForCategory(chatId, telegramId, categoryId, page = 0, editMessageId = null) {
    const session = getSession(telegramId);
    session.context.currentCategory = categoryId;
    session.context.currentInterestPage = Number(page) || 0;
    const interests = getInterests(categoryId);
    const category = getCategories().find((c) => c.id === categoryId);
    if (!category) return;
    const totalPages = Math.max(1, Math.ceil(interests.length / 12));
    const currentPage = Math.min(session.context.currentInterestPage, totalPages - 1);
    session.context.currentInterestPage = currentPage;
    const text = `${header(`${category.emoji} ${category.name}`)}\n\nᴛᴀᴘ ᴀɴʏ ɪɴᴛᴇʀᴇsᴛ ᴛᴏ sᴇʟᴇᴄᴛ ɪᴛ. ʏᴏᴜ ᴄᴀɴ ᴘɪᴄᴋ ᴍᴜʟᴛɪᴘʟᴇ.\n\n📄 ᴘᴀɢᴇ ${currentPage + 1}/${totalPages}\n💚 sᴇʟᴇᴄᴛᴇᴅ: ${session.context.selectedInterests?.length || 0}`;
    const markup = interestPickerKeyboard(interests, session.context.selectedInterests || [], categoryId, currentPage, 12);
    if (editMessageId) await telegram.editMessageText(chatId, editMessageId, text, { replyMarkup: markup });
    else await telegram.sendMessage(chatId, text, { replyMarkup: markup });
  }

  async function toggleInterest(chatId, messageId, telegramId, interestId, categoryId) {
    const session = getSession(telegramId);
    const selected = new Set(session.context.selectedInterests || []);
    if (selected.has(interestId)) selected.delete(interestId); else selected.add(interestId);
    session.context.selectedInterests = [...selected];
    await showInterestsForCategory(chatId, telegramId, categoryId, session.context.currentInterestPage || 0, messageId);
  }

  async function showInterestPage(chatId, telegramId, categoryId, page, messageId) {
    await showInterestsForCategory(chatId, telegramId, categoryId, page, messageId);
  }

  async function askCustomInterest(chatId, telegramId, categoryId) {
    const session = getSession(telegramId);
    session.context.currentCategory = categoryId;
    session.awaiting = 'onboarding_interest_custom';
    await telegram.sendMessage(chatId, `✍️ ᴄᴜsᴛᴏᴍ ɪɴᴛᴇʀᴇsᴛ\n\nᴛʏᴘᴇ ᴏɴᴇ ᴏʀ ᴍᴏʀᴇ ɪɴᴛᴇʀᴇsᴛs, sᴇᴘᴀʀᴀᴛᴇᴅ ʙʏ ᴄᴏᴍᴍᴀs.\nᴇxᴀᴍᴘʟᴇ: ᴀғʀᴏ ᴅᴀɴᴄᴇ, ᴄᴏᴅɪɴɢ ᴡɪᴛʜ ɢᴘᴛ`);
  }

  async function finishInterests(chatId, user) {
    const session = getSession(user.telegram_id);
    const selected = session.context.selectedInterests || [];
    if (!selected.length) { await telegram.sendMessage(chatId, '⚠️ ᴘɪᴄᴋ ᴀᴛ ʟᴇᴀsᴛ ᴏɴᴇ ɪɴᴛᴇʀᴇsᴛ.'); return; }
    profileService.setInterests(user.id, selected);
    session.awaiting = 'onboarding_bio';
    await telegram.sendMessage(chatId, `💬 ᴛᴇʟʟ ᴜs ᴀʙᴏᴜᴛ ʏᴏᴜʀsᴇʟғ ɪɴ ᴀ sᴇɴᴛᴇɴᴄᴇ ᴏʀ ᴛᴡᴏ, ᴏʀ ᴛʏᴘᴇ "sᴋɪᴘ".`);
  }

  async function handleTextStep(chatId, user, text) {
    const session = getSession(user.telegram_id);
    const clean = text.trim();
    if (session.awaiting === 'onboarding_username') {
      const username = clean.replace(/^@+/, '').trim();
      if (!/^[A-Za-z0-9_]{3,32}$/.test(username)) {
        await telegram.sendMessage(chatId, `⚠️ ᴜsᴇʀɴᴀᴍᴇ ᴍᴜsᴛ ʙᴇ 3–32 ᴄʜᴀʀᴀᴄᴛᴇʀs ᴜsɪɴɢ ʟᴇᴛᴛᴇʀs, ɴᴜᴍʙᴇʀs ᴏʀ _.`);
        return true;
      }
      profileService.updateBasics(user.id, { username, displayName: username });
      session.context.username = username;
      session.awaiting = null;
      await telegram.sendMessage(chatId, `✅ ᴜsᴇʀɴᴀᴍᴇ sᴀᴠᴇᴅ: @${username}`);
      await showRequirements(chatId, profileService.getUser(user.id));
      return true;
    }
    if (session.awaiting === 'onboarding_age_custom') {
      const age = Number(clean);
      if (!Number.isInteger(age) || age < 13 || age > 120) {
        await telegram.sendMessage(chatId, '⚠️ ᴘʟᴇᴀsᴇ ᴇɴᴛᴇʀ ᴀ ᴠᴀʟɪᴅ ᴀɢᴇ.');
        return true;
      }
      session.awaiting = null;
      await chooseAge(chatId, user, age);
      return true;
    }
    if (session.awaiting === 'onboarding_photo') {
      if (clean.toLowerCase() === 'skip') {
        session.awaiting = null;
        await showCategories(chatId);
        return true;
      }
      return true;
    }
    if (session.awaiting === 'onboarding_interest_custom') {
      const custom = clean.split(',').map((value) => value.trim()).filter(Boolean).slice(0, 10);
      if (!custom.length) {
        await telegram.sendMessage(chatId, '⚠️ ᴇɴᴛᴇʀ ᴀᴛ ʟᴇᴀsᴛ ᴏɴᴇ ɪɴᴛᴇʀᴇsᴛ.');
        return true;
      }
      const knownByName = new Map(INTERESTS.map((interest) => [interest.name.toLowerCase(), interest.id]));
      const selected = new Set(session.context.selectedInterests || []);
      for (const value of custom) {
        const known = knownByName.get(value.toLowerCase());
        if (known) selected.add(known);
      }
      session.context.selectedInterests = [...selected];
      session.awaiting = null;
      await telegram.sendMessage(chatId, `✅ ᴄᴜsᴛᴏᴍ ɪɴᴛᴇʀᴇsᴛ ʀᴇᴄᴇɪᴠᴇᴅ.\n💚 sᴇʟᴇᴄᴛᴇᴅ: ${session.context.selectedInterests.length}\n\nᴄᴜsᴛᴏᴍ ɴᴀᴍᴇs ᴛʜᴀᴛ ᴍᴀᴛᴄʜ ᴏᴜʀ ᴄᴀᴛᴀʟᴏɢ ᴡɪʟʟ ʙᴇ ᴀᴅᴅᴇᴅ ᴛᴏ ʏᴏᴜʀ sᴇʟᴇᴄᴛɪᴏɴ.`);
      await showInterestsForCategory(chatId, user.telegram_id, session.context.currentCategory, session.context.currentInterestPage || 0);
      return true;
    }
    if (session.awaiting === 'onboarding_bio') {
      if (clean.toLowerCase() !== 'skip') profileService.updateBasics(user.id, { bio: clean });
      session.awaiting = 'onboarding_country';
      await telegram.sendMessage(chatId, `🌎 ᴡʜᴀᴛ ᴄᴏᴜɴᴛʀʏ ᴀʀᴇ ʏᴏᴜ ɪɴ? (ᴏʀ ᴛʏᴘᴇ "sᴋɪᴘ")`);
      return true;
    }
    if (session.awaiting === 'onboarding_country') {
      if (clean.toLowerCase() !== 'skip') profileService.updateBasics(user.id, { country: clean });
      clearAwaiting(user.telegram_id);
      await telegram.sendMessage(chatId, `🎯 ᴡʜᴀᴛ ᴀʀᴇ ʏᴏᴜ ᴍᴀɪɴʟʏ ʟᴏᴏᴋɪɴɢ ғᴏʀ?`, { replyMarkup: lookingForKeyboard() });
      return true;
    }
    return false;
  }

  async function continueSetup(chatId, user) {
    const fresh = profileService.getUser(user.id);
    const session = getSession(user.telegram_id);
    if (!fresh.username && !session.context.username) return startAccountSetup(chatId, fresh);
    if (!fresh.age && !session.context.age) return showAgePicker(chatId, fresh);
    await telegram.sendMessage(chatId, `${header('👤 ᴘʀᴏғɪʟᴇ sᴇᴛᴜᴘ')}\n\nᴡᴇ'ʟʟ ᴄᴏɴᴛɪɴᴜᴇ ᴡɪᴛʜ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ.\n\nᴄʜᴏᴏsᴇ ʏᴏᴜʀ ɢᴇɴᴅᴇʀ ᴛᴏ ᴄᴏɴᴛɪɴᴜᴇ.`, { replyMarkup: genderKeyboard() });
  }

  async function completeOnboarding(chatId, user, lookingFor) {
    profileService.updateBasics(user.id, { lookingFor });
    profileService.completeOnboarding(user.id);
    achievementService.onOnboardingComplete(user.id);
    await telegram.sendMessage(chatId, `🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛ ᴜɴʟᴏᴄᴋᴇᴅ\n\n🌱 ғɪʀsᴛ ᴘʀᴏғɪʟᴇ\nᴄᴏᴍᴘʟᴇᴛᴇᴅ ʏᴏᴜʀ ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ ᴘʀᴏғɪʟᴇ.`);
  }

  return { begin, startAccountSetup, showRequirements, showAgePicker, chooseAge, askCustomAge, continueSetup, chooseGender, handlePhotoStep, showCategories, showInterestsForCategory, showInterestPage, askCustomInterest, toggleInterest, finishInterests, handleTextStep, completeOnboarding };
}
