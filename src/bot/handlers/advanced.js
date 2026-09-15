import { getSession, clearAwaiting } from '../session.js';
import { mainMenuKeyboard, btn, row, backButton } from '../ui/keyboards.js';
import { profileBlock, header } from '../ui/templates.js';

export function createAdvancedHandlers({ telegram, advancedMatchService, profileService, store }) {
  async function sendProfile(chatId, p, text, markup) {
    if (p.photoFileId) { const r=await telegram.sendPhoto(chatId,p.photoFileId,text,{replyMarkup:markup}); if(r?.ok)return; }
    await telegram.sendMessage(chatId,text,{replyMarkup:markup});
  }
  async function likedYou(chatId,user){
    try { advancedMatchService.requireVip(user.id); } catch (err) { await telegram.sendMessage(chatId, '👑 ᴡʜᴏ ʟɪᴋᴇᴅ ʏᴏᴜ ɪs ᴀ ᴠɪᴘ ғᴇᴀᴛᴜʀᴇ. ᴜsᴇ /vip ᴛᴏ ᴄʜᴇᴄᴋ ʏᴏᴜʀ sᴛᴀᴛᴜs.', { replyMarkup: mainMenuKeyboard() }); return; }
    const list=await advancedMatchService.likedYou(user.id,20);
    if(!list.length){await telegram.sendMessage(chatId,`${header('💚 ᴡʜᴏ ʟɪᴋᴇᴅ ʏᴏᴜ')}ɴᴏ ɴᴇᴡ ʟɪᴋᴇs ʏᴇᴛ. ᴋᴇᴇᴘ ᴇxᴘʟᴏʀɪɴɢ!`,{replyMarkup:backButton('menu:main')});return;}
    const s=getSession(user.telegram_id);s.context.likedQueue=list;s.context.likedIndex=0;await showLiked(chatId,user);
  }
  async function showLiked(chatId,user){
    const s=getSession(user.telegram_id),i=s.context.likedIndex||0,list=s.context.likedQueue||[];
    if(i>=list.length){await telegram.sendMessage(chatId,'💚 ᴛʜᴀᴛ’s ᴇᴠᴇʀʏᴏɴᴇ ғᴏʀ ɴᴏᴡ.',{replyMarkup:mainMenuKeyboard()});return;}
    const x=list[i],p=x.profile;
    await sendProfile(chatId,p,`${header('💚 ᴛʜᴇʏ ʟɪᴋᴇᴅ ʏᴏᴜ')}\n${profileBlock(p)}\n\n${x.is_super?'⭐ sᴜᴘᴇʀ ʟɪᴋᴇ':'💚 ʟɪᴋᴇ'}\n\nᴄʜᴏᴏsᴇ ᴡʜᴀᴛ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴅᴏ.`,{inline_keyboard:[row(btn('💚 ʟɪᴋᴇ ʙᴀᴄᴋ',`like:${x.user.id}`,'success'),btn('❌ ᴘᴀss',`likedpass:${x.user.id}`)),row(btn('👤 ᴘʀᴏғɪʟᴇ',`view:${x.user.id}`)),row(btn('➡️ ɴᴇxᴛ','likednext','primary')),row(btn('⬅️ ᴍᴇɴᴜ','menu:main'))]});
  }
  async function likedNext(chatId,user){const s=getSession(user.telegram_id);s.context.likedIndex=(s.context.likedIndex||0)+1;await showLiked(chatId,user);}
  async function rewind(chatId,user){
    try { advancedMatchService.requireVip(user.id); } catch (err) { await telegram.sendMessage(chatId, '👑 ʀᴇᴡɪɴᴅ ɪs ᴀ ᴠɪᴘ ғᴇᴀᴛᴜʀᴇ. ᴜsᴇ /vip ᴛᴏ ᴄʜᴇᴄᴋ ʏᴏᴜʀ sᴛᴀᴛᴜs.', { replyMarkup: mainMenuKeyboard() }); return; }
    const p=advancedMatchService.rewind(user.id); if(!p){await telegram.sendMessage(chatId,'↩️ ɴᴏ ʀᴇᴄᴇɴᴛ ᴘᴀss ᴛᴏ ʀᴇᴡɪɴᴅ.',{replyMarkup:mainMenuKeyboard()});return;}
    const prof=profileService.renderPublicProfile(p.id,{forViewer:user.id}); await sendProfile(chatId,prof,`${header('↩️ ʀᴇᴡɪɴᴅ')}\n${profileBlock(prof)}\n\nʏᴏᴜʀ ʟᴀsᴛ ᴘᴀss ʜᴀs ʙᴇᴇɴ ʀᴇᴡɪɴᴅᴇᴅ.`,{inline_keyboard:[row(btn('💚 ʟɪᴋᴇ',`like:${p.id}`,'success'),btn('❌ ᴘᴀss',`pass:${p.id}`)),row(btn('⬅️ ᴍᴇɴᴜ','menu:main'))]});
  }
  async function vip(chatId,user){const v=advancedMatchService.vipInfo(user.id);await telegram.sendMessage(chatId,`${header('👑 ᴠɪᴘ')}\n${v.active?`👑 ʏᴏᴜʀ ${v.tier.toUpperCase()} ᴘʟᴀɴ ɪs ᴀᴄᴛɪᴠᴇ${v.until?` ᴜɴᴛɪʟ ${v.until}`:''}.`:'✨ ᴜᴘɢʀᴀᴅᴇ ᴛᴏ ᴠɪᴘ ᴛᴏ ᴜɴʟᴏᴄᴋ:'}\n\n• sᴇᴇ ᴡʜᴏ ʟɪᴋᴇᴅ ʏᴏᴜ\n• ⭐ sᴜᴘᴇʀ ʟɪᴋᴇs\n• ↩️ ʀᴇᴡɪɴᴅ\n• 🎯 ᴀᴅᴠᴀɴᴄᴇᴅ ᴍᴀᴛᴄʜɪɴɢ\n• ⭐ ᴠɪᴘ ʙᴀᴅɢᴇ`,{replyMarkup:mainMenuKeyboard()});}
  return {likedYou,showLiked,likedNext,rewind,vip};
}
