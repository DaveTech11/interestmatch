const GENERIC_TEMPLATES = [
  'What are you currently working on?',
  "What's something you've been excited about lately?",
  'How did you first get into this?',
  "What's a project or goal you're proud of right now?",
];

const CATEGORY_TEMPLATES = {
  technology: ['What are you currently building?', 'Any favorite tools or frameworks lately?'],
  gaming: ["What have you been playing lately?", "PC, console, or mobile — what's your setup?"],
  music: ['What have you had on repeat lately?', 'Do you make music or mostly listen?'],
  creative: ['What are you creating these days?', "What's inspiring your work right now?"],
  education: ["What's something new you're learning right now?", 'Self-taught or structured courses?'],
  sports: ["Do you play, watch, or both?", "What's your go-to way to stay active?"],
  business: ["What's the idea you're most excited about right now?", 'Bootstrapping or looking for a team?'],
  travel: ['Where was your last trip?', "What's the next place on your list?"],
  entertainment: ["What have you watched recently that you'd recommend?", 'Any favorites right now?'],
  science: ["What's a topic you could talk about for hours?", 'What got you curious about this?'],
  lifestyle: ["What's your go-to recipe or routine lately?", "What's something you've picked up recently?"],
  nature: ["What's your favorite way to get outdoors?", 'Any trails or spots you love?'],
};

export function createIcebreakerService(interestCatalogService) {
  return {
    /** Returns up to 4 icebreaker suggestions built from the shared interests
     * between two connected users. Falls back to generic, friendly prompts
     * if there is no overlap on record. */
    generate(sharedInterestIds = [], offset = 0) {
      const suggestions = new Set();
      for (const interestId of sharedInterestIds) {
        const interest = interestCatalogService.getInterest(interestId);
        if (!interest) continue;
        const pool = CATEGORY_TEMPLATES[interest.category_id] || [];
        for (const line of pool) suggestions.add(line);
        if (suggestions.size >= 4) break;
      }
      for (const line of GENERIC_TEMPLATES) {
        if (suggestions.size >= 4) break;
        suggestions.add(line);
      }
      const all = [...suggestions];
      // "Choose another" rotates the starting point deterministically so the
      // same shared interests still produce a varied, reproducible set.
      const rotated = all.map((_, i) => all[(i + offset) % all.length]);
      return rotated.slice(0, 4);
    },
  };
}
