import { ValidationError } from '../utils/errors.js';

function words(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
}

export function createPerfectMatchService({ store, discoveryService, interestCatalogService }) {
  async function find(userId, { minAge, maxAge, interests = [], idealText = '', limit = 5 } = {}) {
    const user = store.getUserById(userId);
    if (!user) throw new ValidationError('Profile not found.');
    const ranked = await discoveryService.discover(userId, { limit: 100 });
    const interestIds = new Set(interests.map(String));
    const queryWords = new Set(words(idealText));
    const results = ranked.map((r) => {
      const candidateInterestIds = store.getUserInterests(r.user.id);
      const interestHits = [...interestIds].filter((id) => candidateInterestIds.includes(id)).length;
      const haystack = words([r.user.display_name, r.user.bio, r.user.looking_for, r.user.country, ...candidateInterestIds.map((id) => interestCatalogService.getInterest(id)?.name || '')].join(' '));
      const wordHits = [...queryWords].filter((w) => haystack.includes(w)).length;
      const idealBonus = queryWords.size ? (wordHits / queryWords.size) * 30 : 0;
      const interestBonus = interestIds.size ? (interestHits / interestIds.size) * 20 : 0;
      return { ...r, perfectScore: Math.min(100, Math.round(r.score * 0.55 + idealBonus + interestBonus)), interestHits, wordHits };
    }).filter((r) => {
      if (minAge && (!r.user.age || r.user.age < minAge)) return false;
      if (maxAge && (!r.user.age || r.user.age > maxAge)) return false;
      return true;
    }).sort((a, b) => b.perfectScore - a.perfectScore || b.score - a.score);
    return results.slice(0, limit);
  }
  return { find };
}
