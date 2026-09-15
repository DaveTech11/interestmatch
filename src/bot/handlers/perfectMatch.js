import { getSession, clearAwaiting } from '../session.js';
import { perfectMatchStartKeyboard, perfectMatchCancelKeyboard, perfectMatchResultsKeyboard, backButton } from '../ui/keyboards.js';
import { perfectMatchIntroScreen, perfectMatchResults, profileBlock, header } from '../ui/templates.js';

export function createPerfectMatchHandlers({ telegram, perfectMatchService, store, interestCatalogService, discoveryHandlers, profileService }) {
  async function start(chatId, user) {
    const s = getSession(user.telegram_id);
    s.awaiting = 'perfect_age';
    s.context.perfect = {};
    await telegram.sendMessage(chatId, perfectMatchIntroScreen() + '\n\n🎂 ᴇɴᴛᴇʀ ʏᴏᴜʀ ᴀɢᴇ ʀᴀɴɢᴇ, ᴇ.ɢ. 18-30:', { replyMarkup: perfectMatchCancelKeyboard() });
  }
  async function handleText(chatId, user, text) {
    const s = getSession(user.telegram_id);
    if (!String(s.awaiting || '').startsWith('perfect_')) return false;
    const raw = text.trim();
    if (s.awaiting === 'perfect_age') {
      const m = raw.toLowerCase() === 'any' ? null : raw.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/);
      if (raw.toLowerCase() !== 'any' && !m) { await telegram.sendMessage(chatId, '⚠️ ᴇɴᴛᴇʀ ᴀɢᴇ ʟɪᴋᴇ 18-30 ᴏʀ ᴛʏᴘᴇ any.'); return true; }
      s.context.perfect.minAge = m ? Math.max(18, Number(m[1])) : null;
      s.context.perfect.maxAge = m ? Math.min(99, Number(m[2])) : null;
      if (m && s.context.perfect.minAge > s.context.perfect.maxAge) { await telegram.sendMessage(chatId, '⚠️ ᴛʜᴇ ᴍɪɴɪᴍᴜᴍ ᴍᴜsᴛ ʙᴇ ʟᴏᴡᴇʀ.'); return true; }
      s.awaiting = 'perfect_interests';
      await telegram.sendMessage(chatId, '❤️ ᴛʏᴘᴇ ᴛʜᴇ ɪɴᴛᴇʀᴇsᴛs ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ sʜᴀʀᴇ, sᴇᴘᴀʀᴀᴛᴇᴅ ʙʏ ᴄᴏᴍᴍᴀs.\n\nᴇxᴀᴍᴘʟᴇ: anime, gaming, music');
      return true;
    }
    if (s.awaiting === 'perfect_interests') {
      const terms = raw.split(',').map(x => x.trim().toLowerCase()).filter(Boolean).slice(0, 12);
      const catalog = interestCatalogService.listInterests();
      const chosen = catalog.filter(i => terms.some(t => i.name.toLowerCase() === t || i.name.toLowerCase().includes(t) || t.includes(i.name.toLowerCase()))).map(i => i.id);
      s.context.perfect.interests = [...new Set(chosen)];
      s.context.perfect.interestNames = [...new Set(chosen.map(id => interestCatalogService.getInterest(id)?.name).filter(Boolean))];
      s.awaiting = 'perfect_ideal';
      await telegram.sendMessage(chatId, '✨ ᴅᴇsᴄʀɪʙᴇ ʏᴏᴜʀ ɪᴅᴇᴀʟ ᴍᴀᴛᴄʜ ɪɴ ᴀ ғᴇᴡ ᴡᴏʀᴅs.\n\nᴇxᴀᴍᴘʟᴇ: someone who likes anime, gaming and late-night conversations');
      return true;
    }
    if (s.awaiting === 'perfect_ideal') {
      s.context.perfect.idealText = raw.slice(0, 300);
      const criteria = { ...s.context.perfect };
      clearAwaiting(user.telegram_id);
      const results = await perfectMatchService.find(user.id, { ...criteria, limit: 5 });
      const session = getSession(user.telegram_id);
      session.context.perfectResults = results;
      await telegram.sendMessage(chatId, perfectMatchResults(results), { replyMarkup: perfectMatchResultsKeyboard(results) });
      return true;
    }
    return false;
  }
  async function view(chatId, user, targetId) { await discoveryHandlers.showCandidate(chatId, user, Number(targetId)); }
  async function cancel(chatId, user) { clearAwaiting(user.telegram_id); await telegram.sendMessage(chatId, '💘 ᴘᴇʀғᴇᴄᴛ ᴍᴀᴛᴄʜ ᴄᴀɴᴄᴇʟʟᴇᴅ.', { replyMarkup: backButton() }); }
  return { start, handleText, view, cancel };
}
