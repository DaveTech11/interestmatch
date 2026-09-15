const sessions = new Map(); // telegramId -> { awaiting, context, queue }
const relayPartners = new Map(); // userId -> partnerUserId

export function getSession(telegramId) {
  if (!sessions.has(telegramId)) {
    sessions.set(telegramId, { awaiting: null, context: {}, queue: [] });
  }
  return sessions.get(telegramId);
}

export function clearAwaiting(telegramId) {
  const s = getSession(telegramId);
  s.awaiting = null;
  s.context = {};
}

export function setRelay(userIdA, userIdB) {
  relayPartners.set(userIdA, userIdB);
  relayPartners.set(userIdB, userIdA);
}
export function getRelayPartner(userId) {
  return relayPartners.get(userId) || null;
}
export function endRelay(userId) {
  const partner = relayPartners.get(userId);
  relayPartners.delete(userId);
  if (partner) relayPartners.delete(partner);
}
