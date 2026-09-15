function row(...buttons) { return buttons; }
function btn(text, callbackData, style = 'primary') {
  // Telegram supports button styles on Bot API versions that expose InlineKeyboardButton.style.
  // Keeping it on the button object is harmless for older clients/API versions.
  return { text, callback_data: callbackData, style };
}

export function mainMenuKeyboard() {
  return { inline_keyboard: [
    row(btn('🔍 ᴅɪsᴄᴏᴠᴇʀ', 'discover:best_match', 'success')),
    row(btn('🎯 ᴍᴀᴛᴄ & ғɪɴᴅ', 'menu:match_types', 'success'), btn('🔥 ᴛʀᴇɴᴅɪɴɢ ᴘᴇᴏᴘʟᴇ', 'menu:trending_people', 'primary')),
    row(btn('🔎 sᴇᴀʀᴄ', 'menu:search'), btn('⭐ sᴀᴠᴇᴅ', 'menu:saved')),
    row(btn('💚 ᴡʜᴏ ʟɪᴋᴇᴅ ᴍᴇ', 'menu:liked_you', 'success'), btn('↩️ ʀᴇᴡɪɴᴅ', 'menu:rewind', 'primary')),
    row(btn('💘 ᴘᴇʀғᴇᴄᴛ ᴍᴀᴛᴄʜ', 'menu:perfect_match', 'success')), 
    row(btn('👑 ᴠɪᴘ', 'menu:vip', 'primary')),
    row(btn('📊 sᴛᴀᴛs', 'menu:stats'), btn('🧬 ɪɴᴛᴇʀᴇsᴛ ᴅɴᴀ', 'menu:dna')),
    row(btn('🕘 ʜɪsᴛᴏʀʏ', 'menu:history'), btn('🌎 ɴᴇᴀʀʙʏ', 'menu:nearby')),
    row(btn('🌎 ᴄᴏᴍᴍᴜɴɪᴛɪᴇs', 'menu:communities'), btn('👀 ᴀᴄᴛɪᴠɪᴛʏ', 'menu:activity')),
    row(btn('👤 ᴍʏ ᴘʀᴏғɪʟᴇ', 'menu:profile'), btn('🕶️ ᴘʀɪᴠᴀᴄʏ', 'menu:privacy')),
  ]};
}

export function matchTypesKeyboard() {
  return { inline_keyboard: [
    row(btn('🔥 ʙᴇsᴛ ᴍᴀᴛᴄʜ', 'discover:best_match', 'success')),
    row(btn('🧩 sɪᴍɪʟᴀʀ ɪɴᴛᴇʀᴇsᴛs', 'discover:similar_interests')),
    row(btn('💻 sᴋɪʟʟ ᴍᴀᴛᴄ', 'discover:skill_match')),
    row(btn('🎮 ɢᴀᴍɪɴɢ', 'discover:gaming_match')),
    row(btn('📚 ʟᴇᴀʀɴɪɴɢ', 'discover:learning_match')),
    row(btn('🎵 ᴍᴜsɪᴄ', 'discover:music_match')),
    row(btn('⚽ sᴘᴏʀᴛs', 'discover:sports_match')),
    row(btn('🚀 ʙᴜsɪɴᴇss', 'discover:business_match')),
    row(btn('🎨 ᴄʀᴇᴀᴛɪᴠᴇ', 'discover:creative_match')),
    row(btn('✈️ ᴛʀᴀᴠᴇʟ', 'discover:travel_match')),
    row(btn('🎬 ᴇɴᴛᴇʀᴛᴀɪɴᴍᴇɴᴛ', 'discover:entertainment_match')),
    row(btn('🔬 sᴄɪᴇɴᴄᴇ', 'discover:science_match')),
    row(btn('🍳 ʟɪғᴇsᴛʏʟᴇ', 'discover:lifestyle_match')),
    row(btn('🌱 ɴᴀᴛᴜʀᴇ', 'discover:nature_match')),
    row(btn('🌎 ɴᴇᴀʀʙʏ', 'discover:nearby_interests')),
    row(btn('✨ ɴᴇᴡ ᴅɪsᴄᴏᴠᴇʀɪᴇs', 'discover:new_discovery')),
    row(btn('✍️ ᴄᴜsᴛᴏᴍ ᴡʜᴀᴛ ɪ ᴡᴀɴᴛ', 'menu:custom_match', 'success')),
    row(btn('⚡ ǫᴜɪᴄᴋ ᴍᴀᴛᴄʜ', 'menu:quick_match', 'success'), btn('🌟 ᴅᴀɪʟʏ ᴍᴀᴛᴄʜ', 'menu:daily_match', 'primary')),
    row(btn('⬅️ ʙᴀᴄᴋ', 'menu:main')),
  ]};
}

export function discoveryCardKeyboard(targetUserId, matchType = 'best_match', mode = 'relationship') {
  const likeAction = matchType === 'daily_match' ? 'dailylike' : 'like';
  const passAction = matchType === 'daily_match' ? 'dailypass' : 'pass';
  const nextAction = matchType === 'quick_match' ? 'quicknext' : 'next';
  if (mode === 'friendship') {
    return { inline_keyboard: [
      row(btn('🤝 ɪɴᴛᴇʀᴀᴄᴛ', `interact:${targetUserId}`, 'success'), btn('➡️ ɴᴇxᴛ', `next:${matchType}:${targetUserId}`, 'primary')),
      row(btn('🤝 sᴇɴᴅ ғʀɪᴇɴᴅ ʀᴇǫᴜᴇsᴛ', `friendconnect:${targetUserId}`, 'success')),
      row(btn('⭐ sᴀᴠᴇ', `save:${targetUserId}`), btn('⛔ ʜɪᴅᴇ', `hide:${targetUserId}`)),
      row(btn('🚫 ʙʟᴏᴄᴋ', `block:${targetUserId}`, 'danger'), btn('🚨 ʀᴇᴘᴏʀᴛ', `report:${targetUserId}`)),
      row(btn('⬅️ ᴍᴇɴᴜ', 'menu:main')),
    ]};
  }
  return { inline_keyboard: [
    row(btn('👤 ɪɴᴛᴇʀᴀᴄᴛ', `interact:${targetUserId}`, 'success'), btn('➡️ ɴᴇxᴛ', `${nextAction}:${matchType}:${targetUserId}`, 'primary')),
    row(btn('💚 ʟɪᴋᴇ', `${likeAction}:${targetUserId}`, 'success'), btn('❌ ᴘᴀss', `${passAction}:${targetUserId}`)),
    row(btn('⭐ sᴜᴘᴇʀ ʟɪᴋᴇ', `superlike:${targetUserId}`, 'primary')),
    row(btn('💚 ᴄᴏɴɴᴇᴄᴛ', `connect:${targetUserId}`, 'success')),
    row(btn('⭐ sᴀᴠᴇ', `save:${targetUserId}`), btn('⛔ ʜɪᴅᴇ', `hide:${targetUserId}`)),
    row(btn('🚫 ʙʟᴏᴄᴋ', `block:${targetUserId}`, 'danger'), btn('🚨 ʀᴇᴘᴏʀᴛ', `report:${targetUserId}`)),
    row(btn('⬅️ ᴍᴇɴᴜ', 'menu:main')),
  ]};
}

export function friendshipProfileKeyboard(targetUserId) {
  return { inline_keyboard: [
    row(btn('🤝 sᴇɴᴅ ғʀɪᴇɴᴅ ʀᴇǫᴜᴇsᴛ', `friendconnect:${targetUserId}`, 'success')),
    row(btn('➡️ ɴᴇxᴛ', `next:best_match:${targetUserId}`, 'primary')),
    row(btn('⭐ sᴀᴠᴇ', `save:${targetUserId}`), btn('⛔ ʜɪᴅᴇ', `hide:${targetUserId}`)),
    row(btn('🚫 ʙʟᴏᴄᴋ', `block:${targetUserId}`, 'danger'), btn('🚨 ʀᴇᴘᴏʀᴛ', `report:${targetUserId}`)),
    row(btn('⬅️ ᴅɪsᴄᴏᴠᴇʀʏ', 'discover:best_match', 'primary')),
  ]};
}

export function interactProfileKeyboard(targetUserId) {
  return { inline_keyboard: [
    row(btn('💚 ʟɪᴋᴇ', `like:${targetUserId}`, 'success'), btn('❌ ᴘᴀss', `pass:${targetUserId}`)),
    row(btn('💌 ᴄᴏɴɴᴇᴄᴛ', `connect:${targetUserId}`, 'success'), btn('➡️ ɴᴇxᴛ', `next:best_match:${targetUserId}`, 'primary')),
    row(btn('⭐ sᴀᴠᴇ', `save:${targetUserId}`)),
    row(btn('⬅️ ʙᴀᴄᴋ ᴛᴏ ᴅɪsᴄᴏᴠᴇʀʏ', 'discover:best_match', 'primary')),
  ]};
}

export function trendingPeopleKeyboard(targetUserId) {
  return { inline_keyboard: [
    row(btn('💚 ᴀᴄᴄᴇᴘᴛ', `trendingaccept:${targetUserId}`, 'success'), btn('❌ ᴅᴇᴄʟɪɴᴇ', `trendingskip:${targetUserId}`)),
    row(btn('👤 ᴘʀᴏғɪʟᴇ', `view:${targetUserId}`), btn('➡️ ɴᴇxᴛ', `trendingnext:${targetUserId}`)),
    row(btn('⭐ sᴀᴠᴇ', `save:${targetUserId}`), btn('⬅️ ᴍᴇɴᴜ', 'menu:main')),
  ]};
}

export function connectionReasonKeyboard(targetUserId) {
  return { inline_keyboard: [
    row(btn('💻 sʜᴀʀᴇᴅ ᴛᴇᴄʜ', `connectreason:${targetUserId}:tech`)),
    row(btn('🎮 ɢᴀᴍɪɴɢ', `connectreason:${targetUserId}:gaming`)),
    row(btn('📚 ʟᴇᴀʀɴɪɴɢ', `connectreason:${targetUserId}:learning`)),
    row(btn('🚀 ɴᴇᴛᴡᴏʀᴋɪɴɢ', `connectreason:${targetUserId}:networking`)),
    row(btn('✍️ ᴡʀɪᴛᴇ ᴍʏ ᴏᴡɴ', `connectreason:${targetUserId}:custom`, 'success')),
    row(btn('❌ ᴄᴀɴᴄᴇʟ', 'menu:main')),
  ]};
}

export function connectionRequestKeyboard(connectionId) {
  return { inline_keyboard: [
    row(btn('✅ ᴀᴄᴄᴇᴘᴛ', `accept:${connectionId}`, 'success'), btn('❌ ᴅᴇᴄʟɪɴᴇ', `decline:${connectionId}`)),
  ]};
}

export function acceptedConnectionKeyboard(connectionId) {
  return { inline_keyboard: [
    row(btn('💬 ᴍᴇssᴀɢᴇ', `message:${connectionId}`, 'success')),
    row(btn('👤 ᴠɪᴇᴡ ᴘʀᴏғɪʟᴇ', `connectionprofile:${connectionId}`)),
    row(btn('⬅️ ᴍᴇɴᴜ', 'menu:main')),
  ]};
}

export function icebreakerKeyboard(connectionId, options) {
  return { inline_keyboard: [
    ...options.map((text, i) => row(btn(`💬 sᴇɴᴅ: ${text.slice(0, 32)}`, `icebreaker:${connectionId}:${i}`, 'success'))),
    row(btn('🔁 ᴍᴏʀᴇ ɪᴅᴇᴀs', `icebreaker_more:${connectionId}`)),
    row(btn('💬 ᴊᴜsᴛ ᴍᴇssᴀɢᴇ', `message:${connectionId}`, 'primary')),
  ]};
}

export function privacyMenuKeyboard(settings, labels) {
  const rows = Object.entries(labels).map(([field, label]) => row(btn(`${settings[field] ? '🟢' : '⚪️'} ${label}`, `privacy:${field}`)));
  rows.push(row(btn('🗑️ ᴅᴇʟᴇᴛᴇ ᴍʏ ᴅᴀᴛᴀ', 'privacy:delete_confirm', 'danger')));
  rows.push(row(btn('⬅️ ʙᴀᴄᴋ', 'menu:main')));
  return { inline_keyboard: rows };
}

export function profileModeKeyboard(currentMode) {
  const modes = [['public','🟢 ᴅɪsᴄᴏᴠᴇʀᴀʙʟᴇ'],['limited','🟡 ʟɪᴍɪᴛᴇᴅ'],['invisible','⚫ ɪɴᴠɪsɪʙʟᴇ']];
  return { inline_keyboard: [...modes.filter(([mode]) => mode !== currentMode).map(([mode,label]) => row(btn(label, `profilemode:${mode}`))), row(btn('⬅️ ʙᴀᴄᴋ', 'menu:profile'))] };
}
export function confirmDeleteKeyboard() { return { inline_keyboard: [row(btn('⚠️ ʏᴇs, ᴅᴇʟᴇᴛᴇ ᴇᴠᴇʀʏᴛʜɪɴɢ', 'privacy:delete_confirmed', 'danger'), btn('❌ ᴄᴀɴᴄᴇʟ', 'menu:privacy'))] }; }
export function categoriesKeyboard(categories, prefix='onboardcat', backTarget='menu:main') { return { inline_keyboard: [...categories.map(c => row(btn(`${c.emoji} ${c.name}`, `${prefix}:${c.id}`))), row(btn('⬅️ ʙᴀᴄᴋ', backTarget))] }; }
export function interestPickerKeyboard(interests, selectedIds, categoryId, page = 0, pageSize = 12) {
  const safeInterests = Array.isArray(interests) ? interests : [];
  const safeSelected = Array.isArray(selectedIds) ? selectedIds : [];
  const totalPages = Math.max(1, Math.ceil(safeInterests.length / pageSize));
  const currentPage = Math.min(Math.max(Number(page) || 0, 0), totalPages - 1);
  const start = currentPage * pageSize;
  const visible = safeInterests.slice(start, start + pageSize);
  const rows = [];
  for (let i = 0; i < visible.length; i += 3) {
    rows.push(visible.slice(i, i + 3).map((interest) => btn(
      `${safeSelected.includes(interest.id) ? '✅' : interest.emoji} ${interest.name}`,
      `toggleinterest:${interest.id}:${categoryId}`,
      safeSelected.includes(interest.id) ? 'success' : 'primary'
    )));
  }
  const nav = [];
  if (currentPage > 0) nav.push(btn('⬅️ ᴘʀᴇᴠ', `onboarding:interests_page:${categoryId}:${currentPage - 1}`, 'primary'));
  if (currentPage < totalPages - 1) nav.push(btn('➡️ ɴᴇxᴛ', `onboarding:interests_page:${categoryId}:${currentPage + 1}`, 'success'));
  if (nav.length) rows.push(nav);
  rows.push(row(btn('✍️ ᴄᴜsᴛᴏᴍ', `onboarding:interest_custom:${categoryId}`, 'success')));
  rows.push(row(btn('✅ ᴅᴏɴᴇ', 'onboarding:interests_done', 'success')));
  rows.push(row(btn('⬅️ ᴄᴀᴛᴇɢᴏʀɪᴇs', 'onboarding:categories', 'primary')));
  return { inline_keyboard: rows };
}
export function communityListKeyboard(interests, categoryId) { return { inline_keyboard: [...interests.map(i => row(btn(`${i.emoji} ${i.name}`, `community:${i.id}`))), row(btn('⬅️ ᴄᴀᴛᴇɢᴏʀɪᴇs', 'menu:communities'))] }; }
export function communityActionsKeyboard(interestId) { return { inline_keyboard: [row(btn('👥 ᴅɪsᴄᴏᴠᴇʀ ᴘᴇᴏᴘʟᴇ', `communitydiscover:${interestId}`, 'success')), row(btn('🔥 ᴛʀᴇɴᴅɪɴɢ', 'menu:trending')), row(btn('⬅️ ʙᴀᴄᴋ', 'menu:communities'))] }; }
export function searchInterestKeyboard(interests) { return { inline_keyboard: [...interests.map(i => row(btn(`${i.emoji} ${i.name}`, `searchinterest:${i.id}`))), row(btn('⏭️ sᴋɪᴘ ɪɴᴛᴇʀᴇsᴛ ғɪʟᴛᴇʀ', 'searchinterest:skip')), row(btn('⬅️ ᴄᴀᴛᴇɢᴏʀɪᴇs', 'menu:search'))] }; }
export function searchMinScoreKeyboard() { return { inline_keyboard: [row(btn('ᴀɴʏ', 'searchscore:0'), btn('50%+', 'searchscore:50')), row(btn('70%+', 'searchscore:70'), btn('85%+', 'searchscore:85'))] }; }
export function genderKeyboard() { return { inline_keyboard: [row(btn('👦 ʙᴏʏ', 'gender:male', 'success'), btn('👧 ɢɪʀʟ', 'gender:female', 'success'))] }; }
export function customMatchKeyboard() { return { inline_keyboard: [row(btn('❌ ᴄᴀɴᴄᴇʟ', 'menu:match_types'))] }; }
export function newMemberKeyboard(userId) { return { inline_keyboard: [row(btn('💚 sᴇᴇ ɪғ ɪᴛ’s ᴍʏ ᴍᴀᴛᴄʜ', `newmember:${userId}`, 'success')), btn('➡️ ʟᴀᴛᴇʀ', 'menu:main')] }; }
export function backButton(target='menu:main') { return { inline_keyboard: [row(btn('⬅️ ʙᴀᴄᴋ', target))] }; }
export { btn, row };

export function perfectMatchStartKeyboard() { return { inline_keyboard: [row(btn('💘 sᴛᴀʀᴛ', 'perfect:start', 'success')), row(btn('⬅️ ᴍᴇɴᴜ', 'menu:main'))] }; }
export function perfectMatchCancelKeyboard() { return { inline_keyboard: [row(btn('❌ ᴄᴀɴᴄᴇʟ', 'perfect:cancel'))] }; }
export function perfectMatchResultsKeyboard(results) { return { inline_keyboard: [...results.map((r,i)=>row(btn(`${i+1}. ${r.user.display_name.slice(0,24)}`, `perfect:view:${r.user.id}`))), row(btn('💘 ʀᴇᴛʀʏ', 'menu:perfect_match')), row(btn('⬅️ ᴍᴇɴᴜ', 'menu:main'))] }; }
export function trendingModesKeyboard() { return { inline_keyboard: [row(btn('❤️ ᴍᴏsᴛ ʟɪᴋᴇᴅ', 'trendingmode:most_liked', 'success')), row(btn('💚 ᴍᴏsᴛ ᴍᴀᴛᴄʜᴇᴅ', 'trendingmode:most_matched')), row(btn('⚡ ᴍᴏsᴛ ᴀᴄᴛɪᴠᴇ', 'trendingmode:most_active')), row(btn('📈 ʀɪsɪɴɢ', 'trendingmode:rising')), row(btn('⬅️ ᴍᴇɴᴜ', 'menu:main'))] }; }
export function nearbyToggleKeyboard(enabled) { return { inline_keyboard: [row(btn(enabled ? '🟢 ɴᴇᴀʀʙʏ ᴏɴ' : '⚪️ ɴᴇᴀʀʙʏ ᴏғғ', 'nearby:toggle', 'success')), row(btn('⬅️ ᴍᴀᴛᴄʜ ᴘʀᴇғs', 'menu:match_preferences'))] }; }
export function reportReasonsKeyboard(targetUserId) { return { inline_keyboard: [row(btn('🚫 sᴘᴀᴍ', `reportreason:${targetUserId}:spam`, 'danger')), row(btn('🔞 ɪɴᴀᴘᴘʀᴏᴘʀɪᴀᴛᴇ', `reportreason:${targetUserId}:inappropriate`, 'danger')), row(btn('🎭 ғᴀᴋᴇ ᴘʀᴏғɪʟᴇ', `reportreason:${targetUserId}:fake`)), row(btn('💸 sᴄᴀᴍ', `reportreason:${targetUserId}:scam`, 'danger')), row(btn('🛑 ʜᴀʀᴀssᴍᴇɴᴛ', `reportreason:${targetUserId}:harassment`, 'danger')), row(btn('⬅️ ᴄᴀɴᴄᴇʟ', 'menu:main'))] }; }
