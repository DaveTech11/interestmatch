export function createTrendingModesService({ store, discoveryService, analyticsService, profileService }) {
  async function get(userId, mode = 'rising', limit = 10) {
    const ranked = await discoveryService.discover(userId, { limit: 100 });
    const since7 = analyticsService.sinceDays(7);
    const since1 = analyticsService.sinceDays(1);
    const events7 = [
      ...store.listEventsSince('profile_viewed', since7),
      ...store.listEventsSince('like_sent', since7),
      ...store.listEventsSince('mutual_match', since7),
      ...store.listEventsSince('connection_requested', since7),
      ...store.listEventsSince('user_active', since7),
    ];
    const events1 = [
      ...store.listEventsSince('profile_viewed', since1),
      ...store.listEventsSince('like_sent', since1),
      ...store.listEventsSince('mutual_match', since1),
    ];
    const score = new Map();
    const likes = new Map(), matches = new Map();
    for (const e of events7) {
      const id = Number(e.meta?.targetUserId || e.meta?.recipientId || e.meta?.otherUserId);
      if (id) score.set(id, (score.get(id) || 0) + 1);
      if (e.event_type === 'like_sent' && id) likes.set(id, (likes.get(id) || 0) + 1);
      if (e.event_type === 'mutual_match' && id) matches.set(id, (matches.get(id) || 0) + 1);
    }
    const recent = new Map();
    for (const e of events1) {
      const id = Number(e.meta?.targetUserId || e.meta?.recipientId || e.meta?.otherUserId || e.user_id);
      if (id) recent.set(id, (recent.get(id) || 0) + 1);
    }
    const list = ranked.map((r) => {
      const weekly = score.get(r.user.id) || 0;
      const daily = recent.get(r.user.id) || 0;
      let modeScore = weekly;
      if (mode === 'most_active') modeScore = (r.user.last_active_at ? 100 : 0) + daily * 8;
      if (mode === 'most_liked') modeScore = (likes.get(r.user.id) || 0) * 10;
      if (mode === 'most_matched') modeScore = (matches.get(r.user.id) || 0) * 12;
      if (mode === 'rising') modeScore = daily * 10 + weekly;
      return { ...r, trendScore: modeScore, trendWeekly: weekly, trendDaily: daily };
    });
    return list.sort((a,b) => b.trendScore-a.trendScore || b.score-a.score).slice(0, limit);
  }
  return { get };
}
