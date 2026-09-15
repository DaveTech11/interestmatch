function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function createStreakService({ store, achievementService, notificationService }) {
  return {
    /** Call once per meaningful discovery session (not per click) to avoid streak-farming. */
    recordActivity(userId) {
      const streak = store.getStreak(userId);
      const today = todayStr();
      if (streak.last_active_date === today) {
        return streak; // already counted today
      }
      const isConsecutive = streak.last_active_date === yesterdayStr();
      const currentStreak = isConsecutive ? streak.current_streak + 1 : 1;
      const longestStreak = Math.max(streak.longest_streak || 0, currentStreak);
      const updated = store.upsertStreak(userId, {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
      });

      // Only surface a milestone every 7 days, not every single day, to
      // respect the "don't spam users" requirement.
      if (currentStreak > 0 && currentStreak % 7 === 0) {
        notificationService.notify(userId, 'streak_milestone', { streak: currentStreak, xp: 150 });
        achievementService.onStreakMilestone(userId, currentStreak);
      }
      return updated;
    },
    get(userId) {
      return store.getStreak(userId);
    },
  };
}
