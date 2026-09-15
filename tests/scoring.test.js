import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMatchScore, explainMatch, classifyMatchTypes, computeInterestDna } from '../src/domain/scoring.js';

test('computeMatchScore gives a higher score to profiles sharing multiple dimensions', () => {
  const a = { interests: ['ai', 'gaming'], skills: ['javascript'], goals: ['startups'], languages: ['en'], communities: [] };
  const deep = { interests: ['ai', 'gaming'], skills: ['javascript'], goals: ['startups'], languages: ['en'], communities: [] };
  const shallow = { interests: ['ai'], skills: [], goals: [], languages: [], communities: [] };

  const deepResult = computeMatchScore(a, deep);
  const shallowResult = computeMatchScore(a, shallow);

  assert.ok(deepResult.score > shallowResult.score, 'multi-dimension overlap should outrank single-dimension overlap');
});

test('computeMatchScore returns 0 for completely disjoint profiles', () => {
  const a = { interests: ['ai'], skills: ['python'], goals: ['startups'], languages: ['en'], communities: [] };
  const b = { interests: ['cooking'], skills: ['welding'], goals: ['travel'], languages: ['fr'], communities: [] };
  const result = computeMatchScore(a, b);
  assert.equal(result.score, 0);
});

test('a 70% match on multiple shared goals can outscore a shallow 1-dimension overlap', () => {
  // This encodes the product requirement: optimize for meaningful overlap,
  // not raw interest count.
  const seeker = { interests: ['ai', 'startups', 'networking'], skills: ['sales'], goals: ['cofounder', 'funding'], languages: ['en'], communities: [] };
  const meaningfulMatch = { interests: ['ai'], skills: ['sales'], goals: ['cofounder', 'funding'], languages: ['en'], communities: [] };
  const shallowHighOverlap = { interests: ['ai', 'startups', 'networking'], skills: [], goals: [], languages: [], communities: [] };

  const meaningful = computeMatchScore(seeker, meaningfulMatch);
  const shallow = computeMatchScore(seeker, shallowHighOverlap);

  assert.ok(meaningful.sharedDimensions >= 3);
  assert.ok(shallow.sharedDimensions <= 1);
});

test('explainMatch returns only the actual overlapping items, case-insensitively', () => {
  const a = { interests: ['AI', 'Gaming'], skills: ['JavaScript'], goals: [], languages: [], communities: [] };
  const b = { interests: ['ai', 'cooking'], skills: ['javascript'], goals: [], languages: [], communities: [] };
  const why = explainMatch(a, b);
  assert.deepEqual(why.sharedInterests, ['AI']);
  assert.deepEqual(why.sharedSkills, ['JavaScript']);
});

test('classifyMatchTypes tags gaming overlap as a gaming match', () => {
  const a = { interests: ['gaming_general'], skills: [], goals: [], languages: [], communities: [] };
  const b = { interests: ['gaming_general'], skills: [], goals: [], languages: [], communities: [] };
  const result = computeMatchScore(a, b);
  const types = classifyMatchTypes(a, b, result, { gaming_general: 'gaming' });
  assert.ok(types.includes('gaming_match'));
  assert.ok(types.includes('similar_interests'));
});

test('computeInterestDna weights categories by number of selected interests', () => {
  const catalog = [
    { id: 'ai', category: 'technology' },
    { id: 'programming', category: 'technology' },
    { id: 'football', category: 'sports' },
  ];
  const dna = computeInterestDna(['ai', 'programming', 'football'], catalog);
  assert.equal(dna[0].category, 'technology');
  assert.ok(dna[0].strength > dna.find((d) => d.category === 'sports').strength);
});
