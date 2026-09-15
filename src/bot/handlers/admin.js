import { header } from '../ui/templates.js';
import { getSession, clearAwaiting } from '../session.js';

export function createAdminHandlers({ telegram, adminService }) {
  async function showSnapshot(chatId, telegramId) {
    try {
      const snapshot = adminService.getSnapshot(telegramId);
      const lines = Object.entries(snapshot).map(([k, v]) => `${k}: ${v}`);
      await telegram.sendMessage(chatId, `${header('🧪 ADMIN SNAPSHOT')}\n${lines.join('\n')}`);
    } catch (err) {
      await telegram.sendMessage(chatId, err.message);
    }
  }

  async function startAnnouncement(chatId, telegramId) {
    if (!adminService.isAdmin(telegramId)) {
      await telegram.sendMessage(chatId, 'Admin access required.');
      return;
    }
    getSession(telegramId).awaiting = 'admin_announcement';
    await telegram.sendMessage(chatId, 'Send the announcement text to broadcast to all users.');
  }

  async function reports(chatId, telegramId) {
    try {
      const reports = adminService.listOpenReports(telegramId);
      if (!reports.length) return telegram.sendMessage(chatId, `${header('🚨 ʀᴇᴘᴏʀᴛs')}ɴᴏ ᴏᴘᴇɴ ʀᴇᴘᴏʀᴛs.`);
      await telegram.sendMessage(chatId, `${header('🚨 ᴏᴘᴇɴ ʀᴇᴘᴏʀᴛs')}\n${reports.slice(0,25).map(r => `#${r.id} · ᴜsᴇʀ ${r.reported_id} · ${r.reason} · ${r.created_at}`).join('\n')}`, { replyMarkup: { inline_keyboard: reports.slice(0,25).map(r => [{text:`✅ ʀᴇsᴏʟᴠᴇ #${r.id}`,callback_data:`adminresolve:${r.id}`,style:'success'}]) } });
    } catch (err) { await telegram.sendMessage(chatId, err.message); }
  }

  async function resolveReport(chatId, telegramId, reportId) {
    try { const ok=adminService.resolveReport(telegramId, reportId, 'reviewed', 'Reviewed by admin'); await telegram.sendMessage(chatId, ok ? `✅ ʀᴇᴘᴏʀᴛ #${reportId} ʀᴇᴠɪᴇᴡᴇᴅ.` : `❌ ᴄᴏᴜʟᴅ ɴᴏᴛ ʀᴇsᴏʟᴠᴇ ʀᴇᴘᴏʀᴛ.`); } catch(err) { await telegram.sendMessage(chatId, err.message); }
  }

  async function handleAnnouncementText(chatId, telegramId, text) {
    const session = getSession(telegramId);
    if (session.awaiting !== 'admin_announcement') return false;
    clearAwaiting(telegramId);
    const result = await adminService.sendAnnouncement(telegramId, text);
    await telegram.sendMessage(chatId, `Announcement sent to ${result.sentTo} users.`);
    return true;
  }

  return { showSnapshot, reports, resolveReport, startAnnouncement, handleAnnouncementText };
}
