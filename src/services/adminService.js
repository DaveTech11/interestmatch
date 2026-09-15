import { env } from '../config/env.js';
import { ForbiddenError } from '../utils/errors.js';
import { DEFAULT_WEIGHTS } from '../domain/scoring.js';
let currentWeights = { ...DEFAULT_WEIGHTS };
export function isAdmin(telegramId) { return env.adminIds.has(Number(telegramId)); }
export function createAdminService({ store, analyticsService, broadcast }) {
  function assertAdmin(telegramId) { if (!isAdmin(telegramId)) throw new ForbiddenError('Admin access required.'); }
  return {
    isAdmin,
    getSnapshot(telegramId) { assertAdmin(telegramId); return analyticsService.productSnapshot(); },
    listOpenReports(telegramId) { assertAdmin(telegramId); return store.listOpenReports(); },
    resolveReport(telegramId, reportId, status='reviewed', note='') { assertAdmin(telegramId); return store.resolveReport(Number(reportId), status, Number(telegramId), note); },
    setUserVip(telegramId, targetUserId, days=30, tier='plus') { assertAdmin(telegramId); const until = new Date(Date.now()+Math.max(1,Number(days))*86400000).toISOString(); return store.setVip(Number(targetUserId), until, tier); },
    async sendAnnouncement(telegramId, message) { assertAdmin(telegramId); store.createAnnouncement(message, telegramId); const userIds=store.listAllUserIds(); if(broadcast) for(const id of userIds){const u=store.getUserById(id); if(u) await broadcast(u.telegram_id, `📣 ɪɴᴛᴇʀᴇsᴛᴍᴀᴛᴄʜ ᴜᴘᴅᴀᴛᴇ\n\n${message}`);} return {sentTo:userIds.length}; },
    getMatchWeights(telegramId) { assertAdmin(telegramId); return {...currentWeights}; },
    setMatchWeights(telegramId, weights) { assertAdmin(telegramId); currentWeights={...currentWeights,...weights}; return {...currentWeights}; },
    getCurrentWeights(){return {...currentWeights};},
  };
}
