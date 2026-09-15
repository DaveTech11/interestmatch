import { logger } from '../utils/logger.js';

const API_BASE = 'https://api.telegram.org';

export function createTelegramClient(token) {
  async function call(method, payload) {
    let res;
    try {
      res = await fetch(`${API_BASE}/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Network-level failure (DNS, connection reset, proxy block, etc).
      // Never let a transient network error crash the bot process.
      logger.error(`telegram api network error (${method})`, err);
      return { ok: false, description: 'network_error' };
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      logger.error(`telegram api returned non-JSON response (${method})`, err);
      return { ok: false, description: 'invalid_response' };
    }

    if (!data.ok) {
      logger.warn('telegram api error', { method, description: data.description });
    }
    return data;
  }

  return {
    getUpdates(offset, timeoutSeconds = 25) {
      return call('getUpdates', { offset, timeout: timeoutSeconds, allowed_updates: ['message', 'callback_query', 'message_reaction'] });
    },
    sendPhoto(chatId, photo, caption = '', { replyMarkup, parseMode } = {}) {
      return call('sendPhoto', { chat_id: chatId, photo, caption, reply_markup: replyMarkup, parse_mode: parseMode });
    },
    getUserProfilePhotos(userId, limit = 1) {
      return call('getUserProfilePhotos', { user_id: userId, offset: 0, limit });
    },
    copyMessage(chatId, fromChatId, messageId, { replyMarkup } = {}) {
      return call('copyMessage', { chat_id: chatId, from_chat_id: fromChatId, message_id: messageId, reply_markup: replyMarkup });
    },
    sendMessage(chatId, text, { replyMarkup, parseMode, replyToMessageId } = {}) {
      return call('sendMessage', {
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
        parse_mode: parseMode,
        reply_to_message_id: replyToMessageId,
        disable_web_page_preview: true,
      });
    },
    editMessageText(chatId, messageId, text, { replyMarkup, parseMode } = {}) {
      return call('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        reply_markup: replyMarkup,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      });
    },
    answerCallbackQuery(callbackQueryId, text) {
      return call('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
    },
    setMyCommands(commands) {
      return call('setMyCommands', { commands });
    },
  };
}
