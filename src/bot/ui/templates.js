import { confidenceBar } from '../../domain/scoring.js';
import { tinyCaps } from '../../utils/tinyCaps.js';

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';

export function header(title = '✨ INTERESTMATCH') {
  return `${DIVIDER}\n      ${tinyCaps(title)}\n${DIVIDER}\n`;
}

export function welcomeScreen(displayName) {
  return `${header()}\nʜᴇʏ ${displayName} 👋\n\n` +
    `ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ ʟᴇᴀʀɴs ᴡʜᴀᴛ ʏᴏᴜ'ʀᴇ ɪɴᴛᴏ ᴀɴᴅ ʜᴇʟᴘs ʏᴏᴜ ғɪɴᴅ ᴘᴇᴏᴘʟᴇ ᴡʜᴏ ᴀᴄᴛᴜᴀʟʟʏ ᴍᴀᴛᴄʜ ʏᴏᴜʀ ᴠɪʙᴇ.\n\n` +
    `ʟᴇᴛ's sᴇᴛ ᴜᴘ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ.`;
}

export function genderScreen() {
  return `${header('👤 ᴘʀᴏғɪʟᴇ sᴇᴛᴜᴘ')}\n` +
    `ᴄʜᴏᴏsᴇ ʏᴏᴜʀ ɢᴇɴᴅᴇʀ sᴏ ᴡᴇ ᴄᴀɴ sʜᴏᴡ ʏᴏᴜ ᴛʜᴇ ᴍᴀᴛᴄʜᴇs ʏᴏᴜ ᴡᴀɴᴛ.\n\n` +
    `👦 ʙᴏʏ → ʙᴏʏs ɢᴇᴛ ɢɪʀʟ ᴍᴀᴛᴄʜᴇs\n👧 ɢɪʀʟ → ɢɪʀʟs ɢᴇᴛ ʙᴏʏ ᴍᴀᴛᴄʜᴇs`;
}

export function discoveryLearningScreen(topCategories) {
  const lines = topCategories.map((c) => `${c.emoji} ${c.name}`).join('\n');
  return `🧠 ʏᴏᴜʀ ᴅɪsᴄᴏᴠᴇʀʏ ɪs ʟᴇᴀʀɴɪɴɢ\n\n` +
    `ᴡᴇ'ʟʟ ᴘʀɪᴏʀɪᴛɪᴢᴇ ᴘᴇᴏᴘʟᴇ ᴡʜᴏ ᴍᴀᴛᴄʜ ʏᴏᴜʀ ɪɴᴛᴇʀᴇsᴛs:\n\n${lines}`;
}

export function whyMatchScreen(why) {
  const sections = [];
  if (why.sharedInterests.length) sections.push(`ʏᴏᴜ ʙᴏᴛʜ ʟɪᴋᴇ:\n\n${why.sharedInterests.map((i) => `${i.emoji} ${i.name}`).join('\n')}`);
  if (why.sharedGoals.length) sections.push(`sʜᴀʀᴇᴅ ɢᴏᴀʟs:\n\n${why.sharedGoals.map((g) => `🎯 ${g}`).join('\n')}`);
  if (why.sharedSkills.length) sections.push(`sʜᴀʀᴇᴅ sᴋɪʟʟs:\n\n${why.sharedSkills.map((s) => `🛠️ ${s}`).join('\n')}`);
  if (why.sharedLanguages?.length) sections.push(`sʜᴀʀᴇᴅ ʟᴀɴɢᴜᴀɢᴇs:\n\n${why.sharedLanguages.map((s) => `🗣️ ${s}`).join('\n')}`);
  return sections.join('\n\n');
}

export function profileBlock(profile) {
  const parts = [
    `${profile.displayName}${profile.verified ? ' ☑️' : ''}${profile.vip ? ' 👑' : ''}${profile.age ? `, ${profile.age}` : ''}${profile.country ? ` · ${profile.country}` : ''}`,
    profile.online ? '🟢 ᴏɴʟɪɴᴇ' : '⚪️ ᴏғғʟɪɴᴇ',
    profile.bio ? `\n💬 ${profile.bio}` : '',
    profile.gender ? `\n👤 ${profile.gender === 'male' ? 'ʙᴏʏ' : 'ɢɪʀʟ'}` : '',
    profile.lookingFor ? `\n🎯 ${profile.lookingFor}` : '',
    profile.interests?.length ? `\n❤️ ${profile.interests.map((i) => `${i.emoji} ${i.name}`).join(' · ')}` : '',
  ];
  return parts.filter(Boolean).join('');
}

export function matchCard({ profile, score, why, matchTypeLabel }) {
  const bar = confidenceBar(score);
  const body = whyMatchScreen(why) || `ᴡᴇ'ʀᴇ sᴛɪʟʟ ʟᴇᴀʀɴɪɴɢ ᴡʜᴀᴛ ʏᴏᴜ ʜᴀᴠᴇ ɪɴ ᴄᴏᴍᴍᴏɴ.`;
  return `✨ ${matchTypeLabel}\n\n${profileBlock(profile)}\n\n` +
    `💚 ᴡʜʏ ʏᴏᴜ ᴍᴀᴛᴄʜ\n\n${body}\n\n` +
    `🎯 ᴍᴀᴛᴄʜ ᴄᴏɴғɪᴅᴇɴᴄᴇ\n\n${bar} ${score}%`;
}

export function trendingPeopleCard(profile, score, rank) {
  return `🔥 ᴛʀᴇɴᴅɪɴɢ ᴘᴇʀsᴏɴ #${rank}\n\n${profileBlock(profile)}\n\n🎯 ${score}% ᴍᴀᴛᴄ\n\nᴛʜɪs ᴘᴇʀsᴏɴ ɪs ɢᴇᴛᴛɪɴɢ ʟᴏᴛs ᴏғ ᴀᴛᴛᴇɴᴛɪᴏɴ ʀɪɢʜᴛ ɴᴏᴡ.`;
}

export function newMemberScreen(profile, score) {
  return `🆕 ɴᴇᴡ ᴍᴇᴍʙᴇʀ ᴊᴏɪɴᴇᴅ ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ!\n\n${profileBlock(profile)}\n\n🎯 ᴘᴏᴛᴇɴᴛɪᴀʟ ᴍᴀᴛᴄʜ: ${score}%\n\nᴄʜᴇᴄᴋ ᴛʜᴇɪʀ ᴘʀᴏғɪʟᴇ ᴛᴏ sᴇᴇ ɪғ ᴛʜᴇʏ'ʀᴇ ʏᴏᴜʀ ᴍᴀᴛᴄʜ.`;
}

export function connectionAcceptedScreen(sharedInterests, icebreaker) {
  const shared = sharedInterests.length ? `ʏᴏᴜ ʙᴏᴛʜ ʟɪᴋᴇ:\n\n${sharedInterests.map((i) => `${i.emoji} ${i.name}`).join('\n')}\n\n` : '';
  return `🎉 ᴍᴀᴛᴄʜ ᴀᴄᴄᴇᴘᴛᴇᴅ!\n\n${shared}ʏᴏᴜ ᴛᴡᴏ ᴀʀᴇ ɴᴏᴡ ᴄᴏɴɴᴇᴄᴛᴇᴅ.\n\n💡 ɪᴄᴇʙʀᴇᴀᴋᴇʀ\n\n"${icebreaker}"`;
}

export function statsScreen(stats) { return `📊 ʏᴏᴜʀ ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ\n\nᴘᴇᴏᴘʟᴇ ᴅɪsᴄᴏᴠᴇʀᴇᴅ: ${stats.peopleDiscovered}\nᴘʀᴏғɪʟᴇs ᴠɪᴇᴡᴇᴅ: ${stats.profilesViewed}\nɪɴᴛᴇʀᴇsᴛᴇᴅ: ${stats.interested}\nᴄᴏɴɴᴇᴄᴛɪᴏɴs: ${stats.connections}\n\n🔥 sᴛʀᴇᴀᴋ: ${stats.streak} ᴅᴀʏs\n🎯 ʙᴇsᴛ ᴍᴀᴛᴄʜ: ${stats.bestMatch}%\n🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛs: ${stats.achievementsCount}`; }

export function interestDnaScreen(dna) { const lines = dna.map((d) => { const filled = Math.round((d.strength / 100) * 10); return `${d.category.padEnd(14)} ${'█'.repeat(filled)}${'░'.repeat(10-filled)} ${d.strength}%`; }).join('\n'); return `🧬 ʏᴏᴜʀ ɪɴᴛᴇʀᴇsᴛ ᴅɴᴀ\n\n${lines}`; }
export function streakScreen(streak, xp) { return `🔥 ${streak} ᴅᴀʏ sᴛʀᴇᴀᴋ\n\n+${xp} XP\n🏆 ᴇxᴘʟᴏʀᴇʀ ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛ ᴜɴʟᴏᴄᴋᴇᴅ`; }
export function achievementUnlockedScreen(emoji, name, description) { return `🏆 ᴀᴄʜɪᴇᴠᴇᴍᴇɴᴛ ᴜɴʟᴏᴄᴋᴇᴅ\n\n${emoji} ${name}\n${description}`; }
export function trendingScreen(trending) { if (!trending.length) return `🔥 ᴛʀᴇɴᴅɪɴɢ ᴛʜɪs ᴡᴇᴇᴋ\n\nɴᴏᴛ ᴇɴᴏᴜɢʜ ᴀᴄᴛɪᴠɪᴛʏ ʏᴇᴛ.`; return `🔥 ᴛʀᴇɴᴅɪɴɢ ɪɴᴛᴇʀᴇsᴛs\n\n${trending.map((t) => `${t.rank}. ${t.interest.emoji} ${t.interest.name} · ${t.engagementCount}`).join('\n')}`; }
export function communityScreen(community) { return `${community.interest.emoji} ${community.interest.name.toUpperCase()} ᴄᴏᴍᴍᴜɴɪᴛʏ\n\n${community.memberCount.toLocaleString()} ᴘᴇᴏᴘʟᴇ ɪɴᴛᴇʀᴇsᴛᴇᴅ`; }
export function profileActivityScreen(activity) { if (!activity.enabled) return `👀 ᴘʀᴏғɪʟᴇ ᴀᴄᴛɪᴠɪᴛʏ\n\nᴛʀᴀᴄᴋɪɴɢ ɪs ᴏғғ.`; const interestLines = activity.topInterests.map((i) => `${i.emoji} ${i.name}`).join('\n'); return `👀 ᴘʀᴏғɪʟᴇ ᴀᴄᴛɪᴠɪᴛʏ\n\n${activity.viewCount} ᴘᴇᴏᴘʟᴇ ᴠɪᴇᴡᴇᴅ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ ᴛʜɪs ᴡᴇᴇᴋ.\n\n${interestLines || 'ɴᴏ ᴛʀᴇɴᴅ ʏᴇᴛ.'}`; }
export function savedListScreen(saved) { if (!saved.length) return `⭐ sᴀᴠᴇᴅ ᴘᴇᴏᴘʟᴇ\n\nʏᴏᴜ ʜᴀᴠᴇɴ'ᴛ sᴀᴠᴇᴅ ᴀɴʏᴏɴᴇ ʏᴇᴛ.`; return `⭐ sᴀᴠᴇᴅ ᴘᴇᴏᴘʟᴇ\n\n${saved.map((p) => `${p.displayName} — ${p.score}%`).join('\n\n')}`; }
export function rateLimitScreen() { return `🛡️ sʟᴏᴡ ᴅᴏᴡɴ\n\nʏᴏᴜ'ᴠᴇ ʀᴇᴀᴄʜᴇᴅ ᴛʜᴇ ᴛᴇᴍᴘᴏʀᴀʀʏ ʟɪᴍɪᴛ.`; }
export function connectionRequestSentScreen() { return `🤝 ʀᴇǫᴜᴇsᴛ sᴇɴᴛ. ᴡᴇ'ʟʟ ʟᴇᴛ ʏᴏᴜ ᴋɴᴏᴡ ᴡʜᴇɴ ᴛʜᴇʏ ʀᴇsᴘᴏɴᴅ.`; }
export function newConnectionRequestScreen(fromDisplayName, message) { return `✨ ɴᴇᴡ ᴍᴀᴛᴄʜ ʀᴇǫᴜᴇsᴛ\n\n${fromDisplayName} ᴡᴀɴᴛs ᴛᴏ ᴄᴏɴɴᴇᴄᴛ ᴡɪᴛʜ ʏᴏᴜ.${message ? `\n\n💬 "${message}"` : ''}`; }
export function deleteAllDataConfirmScreen() { return `⚠️ ᴅᴇʟᴇᴛᴇ ᴀʟʟ ᴅᴀᴛᴀ\n\nᴛʜɪs ᴘᴇʀᴍᴀɴᴇɴᴛʟʏ ʀᴇᴍᴏᴠᴇs ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ, ᴍᴀᴛᴄʜᴇs, ᴄᴏɴɴᴇᴄᴛɪᴏɴs ᴀɴᴅ ᴀᴄᴛɪᴠɪᴛʏ.`; }
export function customMatchScreen() { return `✍️ ᴄᴜsᴛᴏᴍ ᴍᴀᴛᴄʜ\n\nᴛᴇʟʟ ᴍᴇ ᴡʜᴀᴛ ʏᴏᴜ ᴡᴀɴᴛ.\n\nᴇxᴀᴍᴘʟᴇ: "ɪ ᴡᴀɴᴛ sᴏᴍᴇᴏɴᴇ ᴡʜᴏ ʟɪᴋᴇs ᴀɴɪᴍᴇ ᴀɴᴅ ɢᴀᴍɪɴɢ"\n\nɪ'ʟʟ ᴜsᴇ ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ + ʏᴏᴜʀ ᴄᴜsᴛᴏᴍ ᴡɪsʜ ᴛᴏ ғɪɴᴅ ᴛʜᴇ ᴄʟᴏsᴇsᴛ ᴘᴇᴏᴘʟᴇ.`; }
export function customMatchNoResults(query) { return `🔎 ᴄᴜsᴛᴏᴍ ᴍᴀᴛᴄʜ\n\nɴᴏ sᴛʀᴏɴɢ ᴍᴀᴛᴄʜᴇs ғᴏᴜɴᴅ ғᴏʀ:\n"${query}"\n\nᴛʀʏ ᴀɴᴏᴛʜᴇʀ ᴘʜʀᴀsᴇ ᴏʀ ᴜsᴇ ᴍᴀᴛᴄʜ & ғɪɴᴅ.`; }
export function menuCaption() { return `✨ ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ\n\nᴍᴀᴛᴄ ᴘᴇᴏᴘʟᴇ. ғɪɴᴅ ʏᴏᴜʀ ᴘᴇᴏᴘʟᴇ. ᴅɪsᴄᴏᴠᴇʀ ᴍᴏʀᴇ.`; }
export function connectionProfileScreen(profile) { return `👤 ᴄᴏɴɴᴇᴄᴛᴇᴅ ᴡɪᴛʜ\n\n${profileBlock(profile)}`; }
export { DIVIDER };


export function quickMatchScreen(profile, score, position = 1) {
  return `⚡ ǫᴜɪᴄᴋ ᴍᴀᴛᴄʜ #${position}

${profileBlock(profile)}

🎯 ᴄᴏᴍᴘᴀᴛɪʙɪʟɪᴛʏ: ${score}%

💚 ʟɪᴋᴇ ɪғ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴍᴀᴛᴄʜ.
⭐ sᴜᴘᴇʀ ʟɪᴋᴇ ғᴏʀ ᴇxᴛʀᴀ ᴀᴛᴛᴇɴᴛɪᴏɴ.`;
}

export function dailyMatchScreen(profile, score) {
  return `🌟 ᴅᴀɪʟʏ ᴍᴀᴛᴄʜ

${profileBlock(profile)}

🎯 ${score}% ᴄᴏᴍᴘᴀᴛɪʙɪʟɪᴛʏ

ᴛʜɪs ᴘᴇʀsᴏɴ ᴡᴀs ᴄʜᴏsᴇɴ ғᴏʀ ʏᴏᴜ ᴛᴏᴅᴀʏ.`;
}

export function mutualMatchScreen(profile, superLike = false) {
  return `💚 ᴍᴜᴛᴜᴀʟ ᴍᴀᴛᴄʜ!

${profileBlock(profile)}

${superLike ? '⭐ ʏᴏᴜ ʙᴏᴛʜ ᴄᴏɴɴᴇᴄᴛᴇᴅ ᴡɪᴛʜ ᴀ sᴜᴘᴇʀ ʟɪᴋᴇ.' : '✨ ʏᴏᴜ ʙᴏᴛʜ ʟɪᴋᴇᴅ ᴇᴀᴄʜ ᴏᴛʜᴇʀ.'}`;
}

export function matchPreferencesScreen(pref) {
  const age = pref.min_age || pref.max_age ? `${pref.min_age || 18}–${pref.max_age || 99}` : 'ᴀɴʏ ᴀɢᴇ';
  return `⚙️ ᴍᴀᴛᴄʜ ᴘʀᴇғᴇʀᴇɴᴄᴇs

🎂 ᴀɢᴇ: ${age}
🌎 ɴᴇᴀʀʙʏ ᴏɴʟʏ: ${pref.nearby_only ? 'ᴏɴ' : 'ᴏғғ'}
✍️ ᴄᴜsᴛᴏᴍ ᴡɪsʜ: ${pref.custom_request || 'ɴᴏᴛ sᴇᴛ'}

ᴜsᴇ /matchprefs ᴛᴏ ᴜᴘᴅᴀᴛᴇ ᴛʜᴇᴍ.`;
}

export function perfectMatchIntroScreen() {
  return `💘 ғɪɴᴅ ᴍʏ ᴘᴇʀғᴇᴄᴛ ᴍᴀᴛᴄʜ\n\nɪ'ʟʟ ᴀsᴋ ʏᴏᴜ 3 ǫᴜᴇsᴛɪᴏɴs ᴀɴᴅ ᴜsᴇ ᴛʜᴇᴍ ᴛᴏ ʀᴀɴᴋ ʏᴏᴜʀ ᴛᴏᴘ 5.\n\n1️⃣ ᴀɢᴇ ʀᴀɴɢᴇ\n2️⃣ ᴛʜᴇ ɪɴᴛᴇʀᴇsᴛs ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ sʜᴀʀᴇ\n3️⃣ ᴛʜᴇ ᴠɪʙᴇ ʏᴏᴜ'ʀᴇ ʟᴏᴏᴋɪɴɢ ғᴏʀ`;
}
export function perfectMatchResults(results) {
  if (!results.length) return `💘 ᴘᴇʀғᴇᴄᴛ ᴍᴀᴛᴄʜ\n\nɪ ᴄᴏᴜʟᴅɴ'ᴛ ғɪɴᴅ ᴀ sᴛʀᴏɴɢ ᴍᴀᴛᴄʜ ʏᴇᴛ. ᴛʀʏ ʙʀᴏᴀᴅᴇʀ ᴘʀᴇғᴇʀᴇɴᴄᴇs.`;
  return `💘 ʏᴏᴜʀ ᴛᴏᴘ ${results.length} ᴘᴇʀғᴇᴄᴛ ᴍᴀᴛᴄʜᴇs\n\n${results.map((r,i)=>`${i+1}. ${r.user.display_name}${r.user.age?`, ${r.user.age}`:''} — ${r.perfectScore}%\n   ${r.interestHits ? `❤️ ${r.interestHits} ɪɴᴛᴇʀᴇsᴛ ᴍᴀᴛᴄʜᴇs` : '✨ ᴏᴠᴇʀᴀʟʟ ᴠɪʙᴇ ᴍᴀᴛᴄʜ'}`).join('\n\n')}`;
}
export function matchHistoryScreen(rows) {
  if (!rows.length) return `🕘 ᴍᴀᴛᴄʜ ʜɪsᴛᴏʀʏ\n\nɴᴏ ᴍᴀᴛᴄʜ ᴀᴄᴛɪᴠɪᴛʏ ʏᴇᴛ.`;
  return `🕘 ᴍᴀᴛᴄʜ ʜɪsᴛᴏʀʏ\n\n${rows.slice(0,20).map((r)=>`${r.action === 'pass' ? '❌' : r.action === 'super_like' ? '⭐' : '💚'} ${r.action.replace('_',' ')} · ${new Date(r.created_at).toLocaleDateString()}`).join('\n')}`;
}
export function trendingModesScreen() { return `🔥 ᴛʀᴇɴᴅɪɴɢ ᴘᴇᴏᴘʟᴇ\n\nᴄʜᴏᴏsᴇ ᴡʜᴀᴛ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ sᴇᴇ.`; }
export function reportReasonsScreen() { return `🚨 ʀᴇᴘᴏʀᴛ ᴘʀᴏғɪʟᴇ\n\nᴡʜᴀᴛ's ᴡʀᴏɴɢ?`; }

export function noMoreMatchesScreen() {
  return `
<b>?? ?? ???? ??????s</b>

???'?? ??????? ??? ??? ?? ???? ??????? ??s?????? ??s?.

??? ???????? ???? ????? ??????????s ?? ???? ???? ?????. ??
`.trim();
}
