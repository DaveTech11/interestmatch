import { getSession, clearAwaiting } from '../session.js';
import { mainMenuKeyboard, discoveryCardKeyboard, backButton, connectionRequestKeyboard } from '../ui/keyboards.js';
import { quickMatchScreen, dailyMatchScreen, mutualMatchScreen, profileBlock, header, matchPreferencesScreen } from '../ui/templates.js';

export function createMatchHandlers({ telegram, matchService, profileService, connectionService, store, advancedMatchService }) {
  async function sendProfile(chatId, profile, text, markup) {
    if (profile.photoFileId) {
      const r = await telegram.sendPhoto(chatId, profile.photoFileId, text, { replyMarkup: markup });
      if (r?.ok) return;
    }
    await telegram.sendMessage(chatId, text, { replyMarkup: markup });
  }
  async function quick(chatId, user) {
    const list = await matchService.quickMatch(user.id, 20);
    const s = getSession(user.telegram_id); s.context.quickQueue = list; s.context.quickIndex = 0;
    await showQuick(chatId, user);
  }
  async function showQuick(chatId, user) {
    const s=getSession(user.telegram_id), i=s.context.quickIndex||0, list=s.context.quickQueue||[];
    if(i>=list.length){ await telegram.sendMessage(chatId,'⚡ ɴᴏ ᴍᴏʀᴇ ǫᴜɪᴄᴋ ᴍᴀᴛᴄʜᴇs ʀɪɢʜᴛ ɴᴏᴡ.',{replyMarkup:mainMenuKeyboard()}); return; }
    const c=list[i], p=profileService.renderPublicProfile(c.user.id,{forViewer:user.id});
    await sendProfile(chatId,p,quickMatchScreen(p,c.score,i+1),discoveryCardKeyboard(c.user.id,'quick_match'));
  }
  async function like(chatId,user,target,superLike=false){
    if (superLike) { try { advancedMatchService.requireVip(user.id); } catch (err) { await telegram.sendMessage(chatId, '👑 sᴜᴘᴇʀ ʟɪᴋᴇs ᴀʀᴇ ᴠɪᴘ-ᴏɴʟʏ. ᴜsᴇ /vip ᴛᴏ ᴄʜᴇᴄᴋ ʏᴏᴜʀ sᴛᴀᴛᴜs.'); return; } }
    const r=matchService.like(user.id,target,{superLike});
    const p=profileService.renderPublicProfile(target,{forViewer:user.id});
    if(r.mutual){ await sendProfile(chatId,p,mutualMatchScreen(p,superLike),{inline_keyboard:[[ {text:'💬 ᴍᴇssᴀɢᴇ',callback_data:`message:${r.connection.id}`,style:'success'} ],[{text:'👤 ᴠɪᴇᴡ ᴘʀᴏғɪʟᴇ',callback_data:`connectionprofile:${r.connection.id}`,style:'primary'}],[{text:'⬅️ ᴍᴇɴᴜ',callback_data:'menu:main'}]]}); }
    else await telegram.sendMessage(chatId,superLike?'⭐ sᴜᴘᴇʀ ʟɪᴋᴇ sᴇɴᴛ!':'💚 ʟɪᴋᴇ sᴇɴᴛ! ɪғ ᴛʜᴇʏ ʟɪᴋᴇ ʏᴏᴜ ʙᴀᴄᴋ, ɪᴛ’s ᴀ ᴍᴜᴛᴜᴀʟ ᴍᴀᴛᴄʜ.');
    const s=getSession(user.telegram_id); s.context.quickIndex=(s.context.quickIndex||0)+1; if(s.context.quickQueue) await showQuick(chatId,user);
  }
  async function pass(chatId,user,target){ matchService.pass(user.id,target); const s=getSession(user.telegram_id); s.context.quickIndex=(s.context.quickIndex||0)+1; await showQuick(chatId,user); }
  async function dailyPass(chatId,user,target){ matchService.pass(user.id,target); await telegram.sendMessage(chatId,'❌ ᴅᴀɪʟʏ ᴍᴀᴛᴄʜ ᴘᴀssᴇᴅ.',{replyMarkup:mainMenuKeyboard()}); }
  async function dailyLike(chatId,user,target){ await like(chatId,user,target,false); await telegram.sendMessage(chatId,'🌟 ᴅᴀɪʟʏ ᴍᴀᴛᴄʜ ᴜᴘᴅᴀᴛᴇᴅ.',{replyMarkup:mainMenuKeyboard()}); }
  async function daily(chatId,user){
    const d=await matchService.dailyMatch(user.id); if(!d){ await telegram.sendMessage(chatId,'🌟 ᴛʜᴇʀᴇ ɪsɴ’ᴛ ᴀ ᴅᴀɪʟʏ ᴍᴀᴛᴄʜ ᴀᴠᴀɪʟᴀʙʟᴇ ʏᴇᴛ.',{replyMarkup:mainMenuKeyboard()}); return; }
    const p=profileService.renderPublicProfile(d.matched_user_id,{forViewer:user.id});
    await sendProfile(chatId,p,dailyMatchScreen(p,d.score),discoveryCardKeyboard(d.matched_user_id,'daily_match'));
  }
  async function showPreferences(chatId,user){ await telegram.sendMessage(chatId,matchPreferencesScreen(store.getMatchPreferences(user.id)),{replyMarkup:backButton('menu:main')}); }
  async function startPreferences(chatId,user){ const s=getSession(user.telegram_id); s.awaiting='match_preferences'; await telegram.sendMessage(chatId,`${header('⚙️ ᴍᴀᴛᴄʜ ᴘʀᴇғᴇʀᴇɴᴄᴇs')}ᴛʏᴘᴇ ʏᴏᴜʀ ᴀɢᴇ ʀᴀɴɢᴇ ʟɪᴋᴇ "18-30" ᴏʀ ᴛʏᴘᴇ "any". ᴛʜᴇɴ ᴡᴇ'ʟʟ sᴇᴛ ᴛʜᴇ ʀᴀɴɢᴇ.`); }
  async function handlePreferencesText(chatId,user,text){ const s=getSession(user.telegram_id); if(s.awaiting!=='match_preferences') return false; const raw=text.trim().toLowerCase(); if(raw==='any'){store.updateMatchPreferences(user.id,{min_age:null,max_age:null}); clearAwaiting(user.telegram_id); await showPreferences(chatId,user); return true;} const m=raw.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})$/); if(!m){await telegram.sendMessage(chatId,'⚠️ ᴜsᴇ ᴀ ғᴏʀᴍᴀᴛ ʟɪᴋᴇ 18-30 ᴏʀ "any".');return true;} const min=Math.max(18,Number(m[1])),max=Math.min(99,Number(m[2])); if(min>max){await telegram.sendMessage(chatId,'⚠️ ᴛʜᴇ ᴍɪɴɪᴍᴜᴍ ᴀɢᴇ ᴍᴜsᴛ ʙᴇ ʟᴏᴡᴇʀ ᴛʜᴀɴ ᴛʜᴇ ᴍᴀxɪᴍᴜᴍ.');return true;} store.updateMatchPreferences(user.id,{min_age:min,max_age:max}); clearAwaiting(user.telegram_id); await showPreferences(chatId,user); return true; }
  return { quick, like, pass, daily, dailyPass, dailyLike, showPreferences, startPreferences, handlePreferencesText };
}
