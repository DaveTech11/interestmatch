import { connectionAcceptedScreen, profileBlock } from '../ui/templates.js';
import { icebreakerKeyboard, mainMenuKeyboard, acceptedConnectionKeyboard } from '../ui/keyboards.js';
import { setRelay, getRelayPartner, endRelay, getSession, clearAwaiting } from '../session.js';
import { NotFoundError } from '../../utils/errors.js';

export function createConnectionHandlers({ telegram, connectionService, achievementService, icebreakerService, interestCatalogService, store, profileService }) {
  async function sendProfile(chatId, profile, caption, replyMarkup) {
    if (profile.photoFileId) { const r=await telegram.sendPhoto(chatId,profile.photoFileId,caption,{replyMarkup}); if(r?.ok) return; }
    await telegram.sendMessage(chatId,caption,{replyMarkup});
  }

  async function respond(chatId,user,connectionId,accept){
    try{
      const connection=connectionService.respond(connectionId,user.id,accept);
      if(!accept){ await telegram.sendMessage(chatId,'❌ ʀᴇǫᴜᴇsᴛ ᴅᴇᴄʟɪɴᴇᴅ.'); return; }
      const otherUserId=connection.requester_id===user.id?connection.recipient_id:connection.requester_id;
      achievementService.onConnectionAccepted(user.id,otherUserId);
      const other=store.getUserById(otherUserId);
      const sharedIds=store.getUserInterests(user.id).filter(id=>store.getUserInterests(otherUserId).includes(id));
      const shared=sharedIds.map(id=>interestCatalogService.getInterest(id)).filter(Boolean);
      const suggestions=icebreakerService.generate(sharedIds);
      for(const targetUserId of [user.id,otherUserId]){
        const target=store.getUserById(targetUserId); const profile=profileService.renderPublicProfile(otherUserId,{forViewer:targetUserId});
        const caption=connectionAcceptedScreen(shared,suggestions[0]||'sᴀʏ ʜɪ 👋')+`\n\n👤 ${profileBlock(profile)}`;
        await sendProfile(target.telegram_id,profile,caption,acceptedConnectionKeyboard(connection.id));
      }
    }catch(err){ await telegram.sendMessage(chatId,`❌ ${err.message}`); }
  }

  async function startMessage(chatId,user,connectionId){
    const connection=store.getConnectionById(Number(connectionId)); if(!connection||connection.status!=='accepted') throw new NotFoundError('Accepted connection not found');
    const otherId=connection.requester_id===user.id?connection.recipient_id:connection.requester_id; const other=store.getUserById(otherId); if(!other) throw new NotFoundError('User not found');
    setRelay(user.id,otherId); const s=getSession(user.telegram_id); s.awaiting='relay_compose'; s.context.relayTarget=otherId;
    await telegram.sendMessage(chatId,`💬 ᴍᴇssᴀɢᴇ ${other.display_name}\n\nᴛʏᴘᴇ ʏᴏᴜʀ ᴍᴇssᴀɢᴇ ɴᴏᴡ.`);
  }

  async function sendIcebreaker(chatId,user,connectionId,optionIndex,options){
    const connection=store.getConnectionById(Number(connectionId)); if(!connection) throw new NotFoundError('Connection not found');
    const otherUserId=connection.requester_id===user.id?connection.recipient_id:connection.requester_id; const other=store.getUserById(otherUserId); if(!other)return;
    const message=options[Number(optionIndex)]; setRelay(user.id,otherUserId); clearAwaiting(user.telegram_id);
    await telegram.sendMessage(other.telegram_id,`💬 ${user.display_name}: ${message}`,{replyMarkup:{inline_keyboard:[[{text:'↩️ ʀᴇᴘʟʏ',callback_data:`reply:${user.id}`,style:'primary'}]]}});
    await telegram.sendMessage(chatId,`✅ sᴇɴᴛ ᴛᴏ ${other.display_name}. ʏᴏᴜ ᴄᴀɴ ᴋᴇᴇᴘ ᴄʜᴀᴛᴛɪɴɢ ʜᴇʀᴇ.`,{replyMarkup:acceptedConnectionKeyboard(connectionId)});
  }

  async function relayMessage(user,text,replyToMessageId){
    const partnerId=getRelayPartner(user.id); if(!partnerId)return false; const partner=store.getUserById(partnerId); if(!partner){endRelay(user.id);return false;}
    clearAwaiting(user.telegram_id);
    await telegram.sendMessage(partner.telegram_id,`💬 ${user.display_name}: ${text}`,{replyToMessageId,replyMarkup:{inline_keyboard:[[{text:'↩️ ʀᴇᴘʟʏ',callback_data:`reply:${user.id}`,style:'primary'}]]}});
    return true;
  }
  async function relayMedia(message) {
    const user = store.getUserByTelegramId(message.from?.id);
    if (!user) return false;
    const partnerId = getRelayPartner(user.id);
    if (!partnerId) return false;
    const partner = store.getUserById(partnerId);
    if (!partner) { endRelay(user.id); return false; }
    const copied = await telegram.copyMessage(partner.telegram_id, message.chat.id, message.message_id, { replyMarkup: { inline_keyboard: [[{ text: '↩️ ʀᴇᴘʟʏ', callback_data: `reply:${user.id}`, style: 'primary' }]] } });
    return Boolean(copied?.ok);
  }
  async function startReply(chatId,user,partnerId){ const partner=store.getUserById(Number(partnerId)); if(!partner)return; setRelay(user.id,partner.id); const s=getSession(user.telegram_id); s.awaiting='relay_compose'; s.context.relayTarget=partner.id; await telegram.sendMessage(chatId,`↩️ ʀᴇᴘʟʏ ᴛᴏ ${partner.display_name}\n\nᴛʏᴘᴇ ʏᴏᴜʀ ᴍᴇssᴀɢᴇ:`); }
  async function connectionProfile(chatId,user,connectionId){ const c=store.getConnectionById(Number(connectionId)); if(!c)return; const otherId=c.requester_id===user.id?c.recipient_id:c.requester_id; const p=profileService.renderPublicProfile(otherId,{forViewer:user.id}); await sendProfile(chatId,p,`👤 ᴄᴏɴɴᴇᴄᴛᴇᴅ ᴡɪᴛʜ\n\n${profileBlock(p)}`,acceptedConnectionKeyboard(connectionId)); }
  async function endChat(chatId,user){ endRelay(user.id); clearAwaiting(user.telegram_id); await telegram.sendMessage(chatId,'🛑 ᴄʜᴀᴛ ʀᴇʟᴀʏ ᴇɴᴅᴇᴅ.',{replyMarkup:mainMenuKeyboard()}); }
  return { respond,startMessage,sendIcebreaker,relayMessage,relayMedia,startReply,connectionProfile,endChat };
}
