const REPORT_PENALTY = 15;
const BLOCK_PENALTY = 5;
const MIN_TRUST = 0;
const MAX_TRUST = 100;
export const DISCOVERY_SUPPRESSION_THRESHOLD = 40; // below this, de-prioritized in discovery

export function createTrustService(store) {
  function clamp(v) {
    return Math.max(MIN_TRUST, Math.min(MAX_TRUST, v));
  }

  return {
    getTrustScore(userId) {
      const user = store.getUserById(userId);
      return user ? user.trust_score : null;
    },
    /** Called whenever a report is filed against a user. */
    applyReportPenalty(reportedUserId) {
      const user = store.getUserById(reportedUserId);
      if (!user) return null;
      const updated = store.updateUser(reportedUserId, {
        trust_score: clamp(user.trust_score - REPORT_PENALTY),
      });
      return updated.trust_score;
    },
    applyBlockPenalty(blockedUserId) {
      const user = store.getUserById(blockedUserId);
      if (!user) return null;
      const updated = store.updateUser(blockedUserId, {
        trust_score: clamp(user.trust_score - BLOCK_PENALTY),
      });
      return updated.trust_score;
    },
    /** Never displayed to the user this score belongs to, or to anyone else. */
    isSuppressedFromDiscovery(userId) {
      const user = store.getUserById(userId);
      return Boolean(user && user.trust_score < DISCOVERY_SUPPRESSION_THRESHOLD);
    },
  };
}
