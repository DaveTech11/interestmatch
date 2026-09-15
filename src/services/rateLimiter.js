import { RateLimitError } from '../utils/errors.js';

// Action -> {limit, windowMs}. Tuned conservatively; adjustable by admins later.
export const RATE_LIMITS = Object.freeze({
  profile_create: { limit: 3, windowMs: 24 * 60 * 60 * 1000 },
  profile_edit: { limit: 20, windowMs: 60 * 60 * 1000 },
  connection_request: { limit: 15, windowMs: 60 * 60 * 1000 },
  message_send: { limit: 30, windowMs: 60 * 60 * 1000 },
  report_submit: { limit: 5, windowMs: 24 * 60 * 60 * 1000 },
  discovery_action: { limit: 200, windowMs: 60 * 60 * 1000 },
});

export function createRateLimiter(store) {
  return {
    /** Throws RateLimitError if the user has exceeded the limit for this action. */
    check(userId, action) {
      const config = RATE_LIMITS[action];
      if (!config) return true; // unknown actions are not limited by default
      const sinceIso = new Date(Date.now() - config.windowMs).toISOString();
      const count = store.countRateLimitActionsSince(userId, action, sinceIso);
      if (count >= config.limit) {
        throw new RateLimitError(
          `You've reached the temporary limit for "${action}". Please try again later.`,
          config.windowMs
        );
      }
      return true;
    },
    record(userId, action) {
      store.recordRateLimitAction(userId, action);
    },
    /** Convenience: check then record in one call. */
    consume(userId, action) {
      this.check(userId, action);
      this.record(userId, action);
    },
  };
}
