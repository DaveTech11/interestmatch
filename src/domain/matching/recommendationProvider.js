import { computeMatchScore, explainMatch, classifyMatchTypes } from '../scoring.js';

/**
 * @typedef {object} RecommendationCandidate
 * @property {object} profile
 * @property {number} score        0-100
 * @property {object} breakdown    per-dimension overlap (0-1)
 * @property {object} why          shared interests/skills/goals/etc
 * @property {string[]} matchTypes discovery categories this candidate qualifies for
 */

/**
 * Interface (documented via JSDoc, enforced by convention + tests):
 *
 *   class RecommendationProvider {
 *     async rank(sourceProfile, candidateProfiles, context): Promise<RecommendationCandidate[]>
 *   }
 *
 * `context` may carry activity signals, interest category map, weights, etc.
 * Any implementation — deterministic today, an AI-scored provider tomorrow —
 * must satisfy this contract. discoveryService only ever talks to this
 * interface, never to a concrete scoring implementation, so swapping in an
 * AI-backed provider later is a one-line change (see README "AI-ready
 * architecture"). No AI API key is referenced anywhere in this codebase.
 */
export class RecommendationProvider {
  // eslint-disable-next-line no-unused-vars
  async rank(sourceProfile, candidateProfiles, context = {}) {
    throw new Error('rank() must be implemented by a RecommendationProvider subclass');
  }
}

export class DeterministicRecommendationProvider extends RecommendationProvider {
  async rank(sourceProfile, candidateProfiles, context = {}) {
    const { weights, activityScoreFn, interestCategoryMap = {} } = context;

    return candidateProfiles
      .map((candidate) => {
        const activityScore = activityScoreFn ? activityScoreFn(sourceProfile, candidate) : 0;
        const matchResult = computeMatchScore(sourceProfile, candidate, { weights, activityScore });
        const why = explainMatch(sourceProfile, candidate);
        const matchTypes = classifyMatchTypes(sourceProfile, candidate, matchResult, interestCategoryMap);
        return {
          profile: candidate,
          score: matchResult.score,
          breakdown: matchResult.breakdown,
          why,
          matchTypes,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
