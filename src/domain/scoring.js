/**
 * InterestMatch scoring engine.
 *
 * Design goal (per product spec): optimize for MEANINGFUL connections, not
 * raw match percentage. A 70% match with strong shared goals should be able
 * to outrank a 95% match built on a single shallow overlap. We do this with:
 *   1. Weighted dimensions (interests/skills/goals/languages/communities)
 *   2. A "depth" bonus for overlap across multiple dimensions at once
 *   3. Fully explainable output — every score ships with the reasons behind it
 *
 * Weights are configurable (admin can tune them later — see adminService).
 */

export const DEFAULT_WEIGHTS = Object.freeze({
  interests: 0.35,
  skills: 0.22,
  goals: 0.2,
  languages: 0.08,
  communities: 0.07,
  activity: 0.08, // rewards two people who are both currently active on the platform
});

function intersect(a = [], b = []) {
  const setB = new Set(b.map((x) => String(x).toLowerCase()));
  const seen = new Set();
  const shared = [];
  for (const item of a) {
    const key = String(item).toLowerCase();
    if (setB.has(key) && !seen.has(key)) {
      shared.push(item);
      seen.add(key);
    }
  }
  return shared;
}

function jaccard(a = [], b = []) {
  if (!a.length && !b.length) return 0;
  const shared = intersect(a, b);
  const union = new Set([...a, ...b].map((x) => String(x).toLowerCase()));
  return union.size === 0 ? 0 : shared.length / union.size;
}

function normalizeActivity(recencyScore = 0) {
  // recencyScore expected 0..1 (1 = both active in the last 24h)
  return Math.max(0, Math.min(1, recencyScore));
}

/**
 * @param {object} profileA {interests, skills, goals, languages, communities}
 * @param {object} profileB same shape
 * @param {object} [opts] {weights, activityScore}
 * @returns {{score:number, breakdown:object, sharedDimensions:number}}
 */
export function computeMatchScore(profileA, profileB, opts = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...(opts.weights || {}) };
  const activityScore = normalizeActivity(opts.activityScore ?? 0);

  const dims = {
    interests: jaccard(profileA.interests, profileB.interests),
    skills: jaccard(profileA.skills, profileB.skills),
    goals: jaccard(profileA.goals, profileB.goals),
    languages: jaccard(profileA.languages, profileB.languages),
    communities: jaccard(profileA.communities, profileB.communities),
    activity: activityScore,
  };

  let raw = 0;
  let weightSum = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    raw += (dims[dim] ?? 0) * weight;
    weightSum += weight;
  }
  const base = weightSum > 0 ? raw / weightSum : 0;

  // Depth bonus: reward overlap that spans multiple dimensions, not just one.
  const sharedDimensions = ['interests', 'skills', 'goals', 'languages', 'communities'].filter(
    (dim) => dims[dim] > 0
  ).length;
  const depthBonus = sharedDimensions >= 3 ? 0.06 : sharedDimensions === 2 ? 0.03 : 0;

  const finalScore = Math.max(0, Math.min(1, base + depthBonus));

  return {
    score: Math.round(finalScore * 100),
    breakdown: dims,
    sharedDimensions,
  };
}

/**
 * Builds a human, non-random "why you match" explanation.
 */
export function explainMatch(profileA, profileB) {
  return {
    sharedInterests: intersect(profileA.interests, profileB.interests),
    sharedSkills: intersect(profileA.skills, profileB.skills),
    sharedGoals: intersect(profileA.goals, profileB.goals),
    sharedLanguages: intersect(profileA.languages, profileB.languages),
    sharedCommunities: intersect(profileA.communities, profileB.communities),
  };
}

export function confidenceBar(scorePercent, width = 20) {
  const filled = Math.round((scorePercent / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
}

/**
 * Classifies a scored candidate into the discovery categories the product
 * spec calls for. A candidate can qualify for more than one category —
 * discoveryService picks the requested lane and filters accordingly.
 */
export function classifyMatchTypes(profileA, profileB, matchResult, interestCategoryMap = {}) {
  const { breakdown, score } = matchResult;
  const types = [];

  if (score >= 80) types.push('best_match');
  if (breakdown.interests > 0) types.push('similar_interests');
  if (breakdown.skills > 0.15) types.push('skill_match');
  if (breakdown.goals > 0) types.push('networking_match');

  const shared = explainMatch(profileA, profileB);
  const categoriesOfShared = new Set(
    shared.sharedInterests.map((i) => interestCategoryMap[String(i).toLowerCase()]).filter(Boolean)
  );
  if (categoriesOfShared.has('gaming')) types.push('gaming_match');
  if (categoriesOfShared.has('education')) types.push('learning_match');
  if (profileA.region && profileB.region && profileA.region === profileB.region) {
    types.push('nearby_interests');
  }
  const sharedCategoryIds = new Set(
    shared.sharedInterests
      .map((i) => interestCategoryMap[String(i).toLowerCase()])
      .filter(Boolean)
  );
  for (const categoryId of sharedCategoryIds) {
    types.push(`${categoryId}_match`);
  }
  if (score < 40 && shared.sharedInterests.length === 0) types.push('new_discovery');

  return [...new Set(types)];
}

/**
 * Computes a simple "interest DNA" — normalized strength per category based
 * on how many of the user's selected interests fall in each category, plus
 * an activity weighting so categories the user actually engages with (views,
 * connects) outrank ones they merely selected once at onboarding.
 */
export function computeInterestDna(userInterestIds, interestCatalog, engagementByInterestId = {}) {
  const categoryTotals = new Map();
  const catalogById = new Map(interestCatalog.map((i) => [i.id, i]));

  for (const interestId of userInterestIds) {
    const interest = catalogById.get(interestId);
    if (!interest) continue;
    const engagement = 1 + (engagementByInterestId[interestId] || 0) * 0.5;
    categoryTotals.set(
      interest.category || interest.category_id,
      (categoryTotals.get(interest.category) || 0) + engagement
    );
  }

  const max = Math.max(1, ...categoryTotals.values());
  return [...categoryTotals.entries()]
    .map(([category, total]) => ({
      category,
      strength: Math.round((total / max) * 100),
    }))
    .sort((a, b) => b.strength - a.strength);
}
