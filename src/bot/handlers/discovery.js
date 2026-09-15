import { matchCard, noMoreMatchesScreen, header, communityScreen, profileBlock, trendingPeopleCard, customMatchNoResults } from '../ui/templates.js';
import { discoveryCardKeyboard, connectionReasonKeyboard, mainMenuKeyboard, backButton, communityActionsKeyboard, trendingPeopleKeyboard } from '../ui/keyboards.js';
import { getSession, clearAwaiting } from '../session.js';
import { RateLimitError } from '../../utils/errors.js';

const REASON_MESSAGES = { tech:'sʜᴀʀᴇᴅ ᴛᴇᴄʜ ɪɴᴛᴇʀᴇsᴛs 💻', gaming:'ɢᴀᴍɪɴɢ 🎮', learning:'ʟᴇᴀʀɴɪɴɢ 📚', networking:'ɴᴇᴛᴡᴏʀᴋɪɴɢ 🚀' };

export function createDiscoveryHandlers({ telegram, discoveryService, connectionService, streakService, achievementService, profileService }) {
  function matchTypeLabel(type) { return discoveryService.matchTypeLabels[type] || '✨ ᴅɪsᴄᴏᴠᴇʀʏ'; }
  async function sendProfileMedia(chatId, profile, text, replyMarkup) {
    if (profile.photoFileId) {
      const result = await telegram.sendPhoto(chatId, profile.photoFileId, text, { replyMarkup });
      if (!result?.ok) await telegram.sendMessage(chatId, text, { replyMarkup });
    } else await telegram.sendMessage(chatId, text, { replyMarkup });
  }
  function candidateProfile(candidate) { return profileService.renderPublicProfile(candidate.user.id); }

  async function runDiscovery(chatId, user, matchType, filters = {}) {
    streakService.recordActivity(user.id);
    const results = await discoveryService.discover(user.id, { matchType, filters, limit:20 });
    const session = getSession(user.telegram_id); session.queue = results; session.context.queueIndex=0; session.context.matchType=matchType;
    achievementService.onDiscoveryResults(user.id, results.length, results.length);
    await showCurrentCard(chatId, user);
  }
  async function showCurrentCard(chatId, user) {
    const session = getSession(user.telegram_id); const idx=session.context.queueIndex||0; const queue=session.queue||[];
    if (idx >= queue.length) { await telegram.sendMessage(chatId, noMoreMatchesScreen(), { replyMarkup: mainMenuKeyboard() }); return; }
    const candidate=queue[idx]; const publicProfile=candidateProfile(candidate);
    const text=matchCard({profile:publicProfile, score:candidate.score, why:{ sharedInterests:(candidate.why.sharedInterests||[]).map(id=>publicProfile.interests.find(i=>i&&i.id===id)).filter(Boolean), sharedGoals:candidate.why.sharedGoals||[], sharedSkills:candidate.why.sharedSkills||[], sharedLanguages:candidate.why.sharedLanguages||[] }, matchTypeLabel:matchTypeLabel(session.context.matchType)});
    await sendProfileMedia(chatId, publicProfile, text, discoveryCardKeyboard(candidate.user.id, session.context.matchType));
  }
  async function advance(chatId,user){ const s=getSession(user.telegram_id); s.context.queueIndex=(s.context.queueIndex||0)+1; await showCurrentCard(chatId,user); }
  async function skip(chatId,user,targetUserId){ discoveryService.skipProfile(user.id,targetUserId); await advance(chatId,user); }
  async function hide(chatId,user,targetUserId){ discoveryService.hideProfile(user.id,targetUserId); await telegram.sendMessage(chatId,'⛔ ʜɪᴅᴅᴇɴ.'); await advance(chatId,user); }
  async function block(chatId,user,targetUserId){ discoveryService.blockUser(user.id,targetUserId); await telegram.sendMessage(chatId,'🚫 ᴜsᴇʀ ʙʟᴏᴄᴋᴇᴅ. ᴛʜᴇʏ ᴡᴏɴ’ᴛ ᴀᴘᴘᴇᴀʀ ɪɴ ʏᴏᴜʀ ᴅɪsᴄᴏᴠᴇʀʏ.'); await advance(chatId,user); }
  async function report(chatId,user,targetUserId){ await telegram.sendMessage(chatId,'🚨 ʀᴇᴘᴏʀᴛ ᴘʀᴏғɪʟᴇ', { replyMarkup: { inline_keyboard: [[{text:'🚫 sᴘᴀᴍ',callback_data:`reportreason:${targetUserId}:spam`,style:'danger'}],[{text:'🔞 ɪɴᴀᴘᴘʀᴏᴘʀɪᴀᴛᴇ',callback_data:`reportreason:${targetUserId}:inappropriate`,style:'danger'}],[{text:'🎭 ғᴀᴋᴇ ᴘʀᴏғɪʟᴇ',callback_data:`reportreason:${targetUserId}:fake`}],[{text:'💸 sᴄᴀᴍ',callback_data:`reportreason:${targetUserId}:scam`,style:'danger'}],[{text:'🛑 ʜᴀʀᴀssᴍᴇɴᴛ',callback_data:`reportreason:${targetUserId}:harassment`,style:'danger'}],[{text:'⬅️ ᴄᴀɴᴄᴇʟ',callback_data:'menu:main'}]] } }); }
  async function reportWithReason(chatId,user,targetUserId,reason){ discoveryService.reportProfile(user.id,targetUserId,reason); await telegram.sendMessage(chatId,'🚨 ʀᴇᴘᴏʀᴛ sᴜʙᴍɪᴛᴛᴇᴅ. ᴡᴇ’ʟʟ ʀᴇᴠɪᴇᴡ ᴛʜɪs ᴘʀᴏғɪʟᴇ.'); await advance(chatId,user); }
  async function save(chatId,user,targetUserId,callbackQueryId){ discoveryService.saveProfile(user.id,targetUserId); await telegram.answerCallbackQuery(callbackQueryId,'⭐ sᴀᴠᴇᴅ'); }
  async function view(chatId,user,targetUserId){ const profile=discoveryService.viewProfile(user.id,targetUserId); await sendProfileMedia(chatId,profile,`${header('👤 ᴘʀᴏғɪʟᴇ')}\n${profileBlock(profile)}`,backButton('menu:main')); }
  async function promptConnect(chatId,user,targetUserId){ await telegram.sendMessage(chatId, `🤝 ᴄᴏɴɴᴇᴄᴛ ᴡɪᴛʜ ${profileService.getUser(targetUserId).display_name}\n\nᴄʜᴏᴏsᴇ ᴀ ʀᴇᴀsᴏɴ ᴏʀ ᴡʀɪᴛᴇ ʏᴏᴜʀ ᴏᴡɴ.`, { replyMarkup:connectionReasonKeyboard(targetUserId) }); }
  async function connectWithReason(chatId,user,targetUserId,tag){ if(tag==='custom'){ const s=getSession(user.telegram_id); s.awaiting='connect_message'; s.context.connectTarget=targetUserId; await telegram.sendMessage(chatId,'✍️ ᴛʏᴘᴇ ʏᴏᴜʀ ᴍᴇssᴀɢᴇ (ᴍᴀx 240 ᴄʜᴀʀs).'); return; } await sendConnectionRequest(chatId,user,targetUserId,REASON_MESSAGES[tag]||null); }
  async function sendConnectionRequest(chatId,user,targetUserId,message){ try{ connectionService.sendRequest(user.id,targetUserId,message); await telegram.sendMessage(chatId,`💚 ʀᴇǫᴜᴇsᴛ sᴇɴᴛ. ᴛʜᴇʏ'ʟʟ ɢᴇᴛ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ ᴀɴᴅ ᴄᴀɴ ᴀᴄᴄᴇᴘᴛ ᴏʀ ᴅᴇᴄʟɪɴᴇ.`); }catch(err){ await telegram.sendMessage(chatId,err instanceof RateLimitError?'🛡️ sʟᴏᴡ ᴅᴏᴡɴ — ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.':`❌ ${err.message}`); } }
  async function handleConnectMessageText(chatId,user,text){ const s=getSession(user.telegram_id); if(s.awaiting!=='connect_message') return false; const target=s.context.connectTarget; clearAwaiting(user.telegram_id); await sendConnectionRequest(chatId,user,target,text); return true; }
  async function showCommunity(chatId,interestId){ const c=discoveryServiceCommunity(interestId); if(!c) return telegram.sendMessage(chatId,'ᴛʜᴀᴛ ᴄᴏᴍᴍᴜɴɪᴛʏ ɪs ɴᴏᴛ ᴀᴠᴀɪʟᴀʙʟᴇ.'); await telegram.sendMessage(chatId,communityScreen(c),{replyMarkup:communityActionsKeyboard(interestId)}); }
  let discoveryServiceCommunity=()=>null; function bindCommunityLookup(fn){ discoveryServiceCommunity=fn; }
  async function discoverWithinCommunity(chatId,user,interestId){ await runDiscovery(chatId,user,'similar_interests',{interest:interestId}); }

  async function showCandidate(chatId,user,targetUserId){
    if (!discoveryService.isGenderCompatible(user.id,targetUserId)) { await telegram.sendMessage(chatId,'⚠️ ᴛʜɪs ᴘᴇʀsᴏɴ ᴅᴏᴇs ɴᴏᴛ ᴍᴀᴛᴄʜ ʏᴏᴜʀ ɢᴇɴᴅᴇʀ ᴘʀᴇғᴇʀᴇɴᴄᴇ.'); return; }
    const ranked=await discoveryService.discover(user.id,{limit:100}); const found=ranked.find(r=>r.user.id===targetUserId);
    if (!found) { await telegram.sendMessage(chatId,`🌱 ᴛʜɪs ᴘʀᴏғɪʟᴇ ɪsɴ'ᴛ ᴀᴠᴀɪʟᴀʙʟᴇ ʀɪɢʜᴛ ɴᴏᴡ.`,{replyMarkup:mainMenuKeyboard()}); return; }
    const p=candidateProfile(found); const s=getSession(user.telegram_id); s.queue=ranked; s.context.queueIndex=Math.max(0,ranked.findIndex(r=>r.user.id===targetUserId)); s.context.matchType='best_match';
    await sendProfileMedia(chatId,p,matchCard({profile:p,score:found.score,why:{sharedInterests:(found.why.sharedInterests||[]).map(id=>p.interests.find(i=>i&&i.id===id)).filter(Boolean),sharedGoals:found.why.sharedGoals||[],sharedSkills:found.why.sharedSkills||[],sharedLanguages:found.why.sharedLanguages||[]},matchTypeLabel:'💚 ᴘᴏᴛᴇɴᴛɪᴀʟ ᴍᴀᴛᴄʜ'}),discoveryCardKeyboard(targetUserId,'best_match'));
  }

  async function runCustomDiscovery(chatId,user,query){
    const results=await discoveryService.customSearch(user.id,query,20); const s=getSession(user.telegram_id); s.queue=results; s.context.queueIndex=0; s.context.matchType='custom_match'; s.context.customQuery=query;
    if(!results.length){ await telegram.sendMessage(chatId,customMatchNoResults(query),{replyMarkup:mainMenuKeyboard()}); return; }
    await showCurrentCard(chatId,user);
  }

  async function showTrendingPeople(chatId,user){
    const results=await discoveryService.trendingPeople(user.id,15); const s=getSession(user.telegram_id); s.context.trendingQueue=results; s.context.trendingIndex=0;
    await showTrendingCurrent(chatId,user);
  }
  async function showTrendingCurrent(chatId,user){
    const s=getSession(user.telegram_id); const idx=s.context.trendingIndex||0; const list=s.context.trendingQueue||[];
    if(idx>=list.length){ await telegram.sendMessage(chatId,'🔥 ɴᴏ ᴍᴏʀᴇ ᴛʀᴇɴᴅɪɴɢ ᴘᴇᴏᴘʟᴇ ʀɪɢʜᴛ ɴᴏᴡ.',{replyMarkup:mainMenuKeyboard()}); return; }
    const c=list[idx]; const p=candidateProfile(c); await sendProfileMedia(chatId,p,trendingPeopleCard(p,c.score,idx+1),trendingPeopleKeyboard(c.user.id));
  }
  async function trendingAccept(chatId,user,targetUserId){ await sendConnectionRequest(chatId,user,targetUserId,'💚 ʏᴏᴜ ᴡᴇʀᴇ ᴛʀᴇɴᴅɪɴɢ ᴏɴ ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ'); }
  async function trendingSkip(chatId,user,targetUserId){ discoveryService.skipProfile(user.id,targetUserId); const s=getSession(user.telegram_id); s.context.trendingIndex=(s.context.trendingIndex||0)+1; await showTrendingCurrent(chatId,user); }
  async function trendingNext(chatId,user){ const s=getSession(user.telegram_id); s.context.trendingIndex=(s.context.trendingIndex||0)+1; await showTrendingCurrent(chatId,user); }

  return { runDiscovery, showCurrentCard, advance, skip, hide, block, report, reportWithReason, save, view, promptConnect, connectWithReason, handleConnectMessageText, showCommunity, bindCommunityLookup, discoverWithinCommunity, showCandidate, runCustomDiscovery, showTrendingPeople, trendingAccept, trendingSkip, trendingNext };
}
