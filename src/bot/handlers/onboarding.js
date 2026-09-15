import { header, welcomeScreen, discoveryLearningScreen, genderScreen } from '../ui/templates.js';
import { categoriesKeyboard, interestPickerKeyboard, mainMenuKeyboard, genderKeyboard } from '../ui/keyboards.js';
import { getSession, clearAwaiting } from '../session.js';

const LOOKING_FOR_OPTIONS = [
  ['networking', '🤝 ɴᴇᴛᴡᴏʀᴋɪɴɢ'], ['gaming', '🎮 ɢᴀᴍɪɴɢ ʙᴜᴅᴅɪᴇs'], ['learning', '📚 ʟᴇᴀʀɴɪɴɢ ᴘᴀʀᴛɴᴇʀ'],
  ['chatting', '💬 ᴊᴜsᴛ ᴄʜᴀᴛᴛɪɴɢ'], ['anything', '✨ ᴏᴘᴇɴ ᴛᴏ ᴀɴʏᴛʜɪɴɢ'],
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

  async function showCategories(chatId) {
    await telegram.sendMessage(chatId, `${header('🌟 ᴘɪᴄᴋ ʏᴏᴜʀ ɪɴᴛᴇʀᴇsᴛs')}\nᴄʜᴏᴏsᴇ ᴏɴᴇ ᴏʀ ᴍᴏʀᴇ ᴄᴀᴛᴇɢᴏʀɪᴇs:`, { replyMarkup: categoriesKeyboard(interestCatalogService.listCategories(), 'onboardcat') });
  }

  async function showInterestsForCategory(chatId, telegramId, categoryId) {
    const session = getSession(telegramId);
    session.context.currentCategory = categoryId;
    const interests = interestCatalogService.listInterests(categoryId);
    const category = interestCatalogService.listCategories().find((c) => c.id === categoryId);
    if (!category) return;
    await telegram.sendMessage(chatId, `${category.emoji} ${category.name}\n\nᴛᴀᴘ ᴛᴏ sᴇʟᴇᴄᴛ — ᴛᴀᴘ "ᴅᴏɴᴇ" ᴡʜᴇɴ ғɪɴɪsʜᴇᴅ.`, { replyMarkup: interestPickerKeyboard(interests, session.context.selectedInterests || [], categoryId) });
  }

  async function toggleInterest(chatId, messageId, telegramId, interestId, categoryId) {
    const session = getSession(telegramId);
    const selected = new Set(session.context.selectedInterests || []);
    if (selected.has(interestId)) selected.delete(interestId); else selected.add(interestId);
    session.context.selectedInterests = [...selected];
    await telegram.editMessageText(chatId, messageId, `ᴛᴀᴘ ᴛᴏ sᴇʟᴇᴄᴛ — ᴛᴀᴘ "ᴅᴏɴᴇ" ᴡʜᴇɴ ғɪɴɪsʜᴇᴅ.`, { replyMarkup: interestPickerKeyboard(interestCatalogService.listInterests(categoryId), session.context.selectedInterests, categoryId) });
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
    const interestIds = profileService.buildMatchProfile(user.id).interests;
    const selectedInterests = interestIds.map((id) => interestCatalogService.getInterest(id)).filter(Boolean);
    const topCategoryIds = [...new Set(selectedInterests.map((i) => i.category_id))].slice(0, 3);
    const topCategories = topCategoryIds.map((id) => interestCatalogService.listCategories().find((c) => c.id === id)).filter(Boolean);
    await telegram.sendMessage(chatId, discoveryLearningScreen(topCategories.length ? topCategories : selectedInterests.slice(0, 3)));
    const menuMarkup = mainMenuKeyboard();
    const menuSent = await telegram.sendPhoto(chatId, menuImageUrl, `🎉 ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ ɪs ʀᴇᴀᴅʏ!\n\n${header()}`, { replyMarkup: menuMarkup });
    if (!menuSent?.ok) await telegram.sendMessage(chatId, `${header()}\n🎉 ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ ɪs ʀᴇᴀᴅʏ!`, { replyMarkup: menuMarkup });
  }

  return { begin, startAccountSetup, showRequirements, showAgePicker, chooseAge, askCustomAge, continueSetup, chooseGender, handlePhotoStep, showCategories, showInterestsForCategory, toggleInterest, finishInterests, handleTextStep, completeOnboarding };
}
