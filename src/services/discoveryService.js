import { NotFoundError, ForbiddenError } from '../utils/errors.js';

const MATCH_TYPE_LABELS = {
  best_match:'🔥 ʙᴇsᴛ ᴍᴀᴛᴄʜ', similar_interests:'🧩 sɪᴍɪʟᴀʀ ɪɴᴛᴇʀᴇsᴛs', skill_match:'💻 sᴋɪʟʟ ᴍᴀᴛᴄʜ', gaming_match:'🎮 ɢᴀᴍɪɴɢ ᴍᴀᴛᴄʜ', learning_match:'📚 ʟᴇᴀʀɴɪɴɢ ᴍᴀᴛᴄʜ', music_match:'🎵 ᴍᴜsɪᴄ ᴍᴀᴛᴄʜ', sports_match:'⚽ sᴘᴏʀᴛs ᴍᴀᴛᴄʜ', business_match:'🚀 ʙᴜsɪɴᴇss ᴍᴀᴛᴄʜ', creative_match:'🎨 ᴄʀᴇᴀᴛɪᴠᴇ ᴍᴀᴛᴄʜ', travel_match:'✈️ ᴛʀᴀᴠᴇʟ ᴍᴀᴛᴄʜ', entertainment_match:'🎬 ᴇɴᴛᴇʀᴛᴀɪɴᴍᴇɴᴛ ᴍᴀᴛᴄʜ', science_match:'🔬 sᴄɪᴇɴᴄᴇ ᴍᴀᴛᴄʜ', lifestyle_match:'🍳 ʟɪғᴇsᴛʏʟᴇ ᴍᴀᴛᴄʜ', nature_match:'🌱 ɴᴀᴛᴜʀᴇ ᴍᴀᴛᴄʜ', networking_match:'🤝 ɴᴇᴛᴡᴏʀᴋɪɴɢ ᴍᴀᴛᴄʜ', nearby_interests:'🌎 ɴᴇᴀʀʙʏ', new_discovery:'✨ ɴᴇᴡ ᴅɪsᴄᴏᴠᴇʀʏ'
};
function normalizeWords(text){return String(text||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>=2);}
export function createDiscoveryService({store,profileService,interestCatalogService,recommendationProvider,trustService,analyticsService,getWeights=()=>undefined}){
  function discoveryMode(user) {
    const age = Number(user?.age);
    if (Number.isFinite(age) && age >= 14 && age <= 17) return 'friendship';
    return 'relationship';
  }
  function genderCompatible(source,candidate){
    if (discoveryMode(source) === 'friendship') return true;
    if (!source.gender) return true;
    if (!candidate.gender) return false;
    return source.gender !== candidate.gender;
  }
  function ageCompatible(source,candidate){
    const sourceAge = source?.age == null || source?.age === '' ? NaN : Number(source.age);
    const candidateAge = candidate?.age == null || candidate?.age === '' ? NaN : Number(candidate.age);
    // Legacy/test records without an age remain discoverable only with other
    // age-less records. Real onboarded profiles always collect an age.
    if (!Number.isFinite(sourceAge)) return !Number.isFinite(candidateAge);
    if (discoveryMode(source) === 'friendship') {
      return Number.isFinite(candidateAge) && candidateAge === sourceAge && candidateAge >= 14 && candidateAge <= 17;
    }
    return Number.isFinite(candidateAge) && candidateAge >= 18;
  }
  function excludedIds(userId){const excluded=new Set([userId,...store.listSkippedIds(userId),...store.listHiddenIds(userId),...store.listBlockedIds(userId)]);for(const c of store.listPendingForUser(userId))excluded.add(c.requester_id===userId?c.recipient_id:c.requester_id);for(const c of store.listAcceptedConnections(userId))excluded.add(c.requester_id===userId?c.recipient_id:c.requester_id);return excluded;}
  async function rankAllCandidates(userId,{includeUnknownGender=false}={}){
    const sourceUser=profileService.getUser(userId), sourceProfile=profileService.buildMatchProfile(userId), excluded=excludedIds(userId);
    const mode = discoveryMode(sourceUser);
    const pref=typeof store.getMatchPreferences==='function'?store.getMatchPreferences(sourceUser.id):null;
    const candidates=store.listDiscoverableUsers(userId).filter(u=>!excluded.has(u.id)).filter(u=>!store.isBlocked(userId,u.id)).filter(u=>!trustService.isSuppressedFromDiscovery(u.id)).filter(u=>includeUnknownGender?true:genderCompatible(sourceUser,u)).filter(u=>ageCompatible(sourceUser,u)).filter(u=>{
      if (mode === 'friendship') return true;
      if(pref?.min_age&&(!u.age||u.age<pref.min_age))return false;
      if(pref?.max_age&&(!u.age||u.age>pref.max_age))return false;
      if(pref?.nearby_only&&sourceUser.country&&u.country&&sourceUser.country.toLowerCase()!==u.country.toLowerCase())return false;
      return true;
    });
    const candidateProfiles=candidates.map(u=>profileService.buildMatchProfile(u.id)), interestCategoryMap=interestCatalogService.buildCategoryMap();
    return (await recommendationProvider.rank(sourceProfile,candidateProfiles,{weights:getWeights(),interestCategoryMap})).map(result=>({...result,user:candidates.find(u=>u.id===result.profile.userId)})).filter(r=>r.user);
  }
  function customRelevance(user,query){const q=normalizeWords(query);if(!q.length)return 0;const interests=store.getUserInterests(user.id).map(id=>interestCatalogService.getInterest(id)?.name||id);const haystack=normalizeWords([user.display_name,user.username,user.bio,user.country,user.region,user.looking_for,...interests].join(' ')),set=new Set(haystack);let hits=0;for(const word of q)if(set.has(word))hits++;return hits/q.length;}
  return {
    matchTypeLabels:MATCH_TYPE_LABELS,
    discover(userId,opts={}){return this._discoverAsync(userId,opts);},
    async _discoverAsync(userId,opts={}){const {matchType,filters={},limit=10}=opts;const sourceUser=profileService.getUser(userId);const mode=discoveryMode(sourceUser);let ranked=await rankAllCandidates(userId);
    if(mode==='relationship'&&matchType&&matchType!=='best_match')ranked=ranked.filter(r=>r.matchTypes.includes(matchType));
    if(mode==='friendship')ranked=ranked.filter(r=>r.user);
    if(mode==='relationship'&&matchType==='best_match')ranked=ranked.filter(r=>r.user);if(filters.interest)ranked=ranked.filter(r=>store.getUserInterests(r.user.id).includes(filters.interest));if(filters.skill)ranked=ranked.filter(r=>(r.user.skills||[]).some(s=>s.toLowerCase()===filters.skill.toLowerCase()));if(filters.language)ranked=ranked.filter(r=>(r.user.languages||[]).some(l=>l.toLowerCase()===filters.language.toLowerCase()));if(filters.region)ranked=ranked.filter(r=>r.user.region===filters.region);if(filters.lookingFor)ranked=ranked.filter(r=>r.user.looking_for===filters.lookingFor);if(filters.minScore)ranked=ranked.filter(r=>r.score>=filters.minScore);const page=ranked.slice(0,limit);analyticsService.track('user_active',userId,{action:'discover'});for(const r of page){analyticsService.track('match_shown',userId,{matchedUserId:r.user.id,score:r.score});for(const interestId of r.why.sharedInterests)analyticsService.track('interest_engagement',userId,{interestId,source:'discovery'});}return page;},
    async customSearch(userId,query,limit=10){const ranked=await rankAllCandidates(userId),normalized=String(query||'').trim(),scored=ranked.map(r=>({...r,customRelevance:customRelevance(r.user,normalized)})).filter(r=>r.customRelevance>0||r.score>=70).sort((a,b)=>((b.customRelevance*70)+b.score)-((a.customRelevance*70)+a.score));analyticsService.track('custom_match_search',userId,{query:normalized.slice(0,120),resultCount:scored.length});return scored.slice(0,limit);},
    async trendingPeople(userId,limit=10){const ranked=await rankAllCandidates(userId),events=[...store.listEventsSince('profile_viewed',analyticsService.sinceDays(7)),...store.listEventsSince('connection_requested',analyticsService.sinceDays(7)),...store.listEventsSince('like_sent',analyticsService.sinceDays(7))],counts=new Map();for(const event of events){const id=event.meta?.targetUserId||event.meta?.recipientId;if(id)counts.set(Number(id),(counts.get(Number(id))||0)+1);}return ranked.map(r=>({...r,trendScore:counts.get(r.user.id)||0})).sort((a,b)=>b.trendScore-a.trendScore||b.score-a.score).slice(0,limit);},
    getDiscoveryMode(userId){return discoveryMode(profileService.getUser(userId));},
    isGenderCompatible(userId,targetUserId){return genderCompatible(profileService.getUser(userId),profileService.getUser(targetUserId));},
    isAgeCompatible(userId,targetUserId){return ageCompatible(profileService.getUser(userId),profileService.getUser(targetUserId));},
    viewProfile(viewerId,targetUserId){if(viewerId===targetUserId)return profileService.renderPublicProfile(targetUserId,{forViewer:viewerId});const target=store.getUserById(targetUserId);if(!target)throw new NotFoundError('Profile not found');const privacy=store.getPrivacySettings(targetUserId);if(!privacy.allow_connections&&!privacy.allow_profile_views)throw new ForbiddenError('This profile is not viewable right now.');if(privacy.allow_profile_views){store.recordProfileView(viewerId,targetUserId);analyticsService.track('profile_viewed',viewerId,{targetUserId});}return profileService.renderPublicProfile(targetUserId,{forViewer:viewerId});},
    getProfileActivity(userId){const privacy=store.getPrivacySettings(userId);if(!privacy.allow_profile_views)return{enabled:false};const since7=analyticsService.sinceDays(7),viewCount=store.countProfileViewsSince(userId,since7),viewerIds=store.listRecentViewerIds(userId,20),interestCounts=new Map();for(const viewerId of viewerIds)for(const interestId of store.getUserInterests(viewerId))interestCounts.set(interestId,(interestCounts.get(interestId)||0)+1);const topInterests=[...interestCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id])=>interestCatalogService.getInterest(id)).filter(Boolean);return{enabled:true,viewCount,topInterests};},
    saveProfile(userId,savedUserId){store.saveProfile(userId,savedUserId);},unsaveProfile(userId,savedUserId){store.unsaveProfile(userId,savedUserId);},listSaved(userId){return store.listSavedProfileIds(userId).map(id=>store.getUserById(id)).filter(Boolean);},skipProfile(userId,skippedUserId){store.skipProfile(userId,skippedUserId);analyticsService.track('user_active',userId,{action:'skip'});},hideProfile(userId,hiddenUserId){store.hideProfile(userId,hiddenUserId);},blockUser(userId,blockedUserId){store.blockUser(userId,blockedUserId);trustService.applyBlockPenalty(blockedUserId);},
    reportProfile(userId,reportedId,reason='profile'){store.createReport(userId,reportedId,reason);analyticsService.track('profile_reported',userId,{reportedId,reason});}
  };
}
