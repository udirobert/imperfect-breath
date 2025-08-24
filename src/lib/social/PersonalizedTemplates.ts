/**
 * Personalized Social Templates - Smart Template Generation
 * 
 * DRY: Single source of truth for social template logic
 * CLEAN: Separates template logic from UI components
 * MODULAR: Reusable across different social contexts
 */

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  favoritePattern: string;
  lastSessionScore: number;
  weeklyGoalProgress: number;
}

interface SocialTemplate {
  id: string;
  title: string;
  template: string;
  color: string;
  priority: "high" | "medium" | "low";
  icon: string;
}

export class PersonalizedTemplates {
  
  /**
   * ENHANCEMENT FIRST: Builds on basic templates with smart personalization
   */
  static generateTemplates(stats: SessionStats): SocialTemplate[] {
    const timeOfDay = new Date().getHours();
    const isFirstSession = stats.totalSessions === 1;
    const isStreakMilestone = stats.currentStreak > 0 && stats.currentStreak % 7 === 0;
    const isTimeMilestone = stats.totalMinutes > 0 && [30, 60, 120, 300].includes(stats.totalMinutes);
    
    const templates: SocialTemplate[] = [];
    
    // Achievement template with personalization
    templates.push({
      id: "achievement",
      title: isFirstSession ? "First Session!" : "Share Achievement",
      template: isFirstSession 
        ? `Just completed my first breathing session!\n\nStarted with ${stats.favoritePattern} and already feeling the difference. 30 seconds of focused breathing = instant calm.\n\nWho knew something so simple could be so powerful?\n\n#FirstSession #BreathingPractice #MindfulnessJourney`
        : `Just completed my ${stats.totalSessions}th breathing session!\n\n${stats.totalMinutes} minutes of mindful breathing\n${stats.currentStreak} day streak\n${stats.favoritePattern} has become my go-to\n\nFeeling more centered every day\n\n#BreathingPractice #Mindfulness #WellnessJourney`,
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      priority: isFirstSession ? "high" : "medium",
      icon: "Trophy"
    });

    // Milestone template with smart triggers
    if (isTimeMilestone || isStreakMilestone) {
      templates.push({
        id: "milestone",
        title: isStreakMilestone ? `${stats.currentStreak} Day Streak!` : "Time Milestone!",
        template: isStreakMilestone
          ? `${stats.currentStreak} days in a row!\n\nConsistency is everything. What started as a 5-minute experiment has become the best part of my day.\n\n${stats.favoritePattern} is my stress-busting superpower\n\nThe compound effect of small daily actions is real!\n\n#StreakMilestone #ConsistencyWins #MindfulHabits`
          : `Milestone unlocked! ${stats.totalMinutes} minutes of breathing practice!\n\nStarted with just 5 minutes a day, now it's become my favorite part of the routine. The ${stats.favoritePattern} pattern has been a game-changer for my stress levels.\n\nEvery breath counts!\n\n#MindfulnessMilestone #BreathingBenefits #StressRelief`,
        color: "bg-purple-50 border-purple-200 text-purple-800",
        priority: "high",
        icon: "Sparkles"
      });
    }

    // Time-aware progress template
    templates.push({
      id: "progress",
      title: "Weekly Progress",
      template: `Week ${Math.ceil(stats.totalSessions / 7)} of my breathing journey\n\nThis week: ${Math.round(stats.weeklyGoalProgress)}% of my goal\nFavorite pattern: ${stats.favoritePattern}\nKey insight: ${this.getPersonalizedInsight(stats)}\n\n${this.getTimeBasedHashtags()}\n\n#WeeklyProgress #BreathingHabits #MindfulLiving`,
      color: "bg-blue-50 border-blue-200 text-blue-800",
      priority: stats.weeklyGoalProgress > 50 ? "medium" : "low",
      icon: "TrendingUp"
    });

    // Time-aware inspiration template
    templates.push({
      id: "inspiration",
      title: "Inspire Others",
      template: `${this.getTimeBasedOpener(stats, timeOfDay)}\n\n${this.getPersonalizedTip(stats)}\n\nYour nervous system will thank you\n\n${this.getTimeBasedHashtags()}\n\n#BreathingTips #StressRelief #MentalHealth`,
      color: "bg-green-50 border-green-200 text-green-800",
      priority: "medium",
      icon: "Heart"
    });
    
    return templates.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    });
  }

  /**
   * CLEAN: Helper functions for personalization
   */
  private static getPersonalizedInsight(stats: SessionStats): string {
    if (stats.currentStreak >= 7) return "Consistency beats perfection";
    if (stats.totalSessions >= 10) return "Small habits, big changes";
    if (stats.weeklyGoalProgress >= 80) return "Progress over perfection";
    return "Every breath counts";
  }

  private static getTimeBasedOpener(stats: SessionStats, hour: number): string {
    if (hour >= 6 && hour < 12) return `${stats.favoritePattern} just set the tone for my entire day`;
    if (hour >= 12 && hour < 17) return `Mid-day breathing break = instant reset`;
    if (hour >= 17 && hour < 21) return `Evening breathing session = perfect transition`;
    return `${stats.favoritePattern} before bed = better sleep`;
  }

  private static getPersonalizedTip(stats: SessionStats): string {
    if (stats.favoritePattern === "Box Breathing") {
      return "If you're feeling stressed, anxious, or overwhelmed - try box breathing for just 30 seconds. It's incredible how something so simple can be so powerful.";
    }
    if (stats.favoritePattern.includes("Energy")) {
      return "Need a natural energy boost? Try energizing breath patterns instead of reaching for caffeine. Your body has everything it needs.";
    }
    if (stats.favoritePattern.includes("Sleep") || stats.favoritePattern.includes("Relaxation")) {
      return "Struggling with sleep or winding down? Breathing patterns can be more effective than any sleep aid. Natural, safe, always available.";
    }
    return `The ${stats.favoritePattern} pattern has been a game-changer for me. Sometimes the simplest tools are the most powerful.`;
  }

  private static getTimeBasedHashtags(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "#MorningMindfulness #EnergyBoost";
    if (hour >= 12 && hour < 17) return "#MidDayReset #ProductivityHack";
    if (hour >= 17 && hour < 21) return "#EveningCalm #WorkLifeBalance";
    return "#NightTimeRoutine #BetterSleep";
  }

  /**
   * Get quick share templates for immediate use
   */
  static getQuickShareTemplates(stats: SessionStats): SocialTemplate[] {
    const templates = this.generateTemplates(stats);
    return templates.filter(t => t.priority === "high").slice(0, 2);
  }

  /**
   * Get contextual templates based on session completion
   */
  static getPostSessionTemplates(stats: SessionStats, sessionScore: number): SocialTemplate[] {
    const templates = this.generateTemplates(stats);
    
    // Add session-specific template if score is high
    if (sessionScore >= 80) {
      templates.unshift({
        id: "session-success",
        title: "Session Success",
        template: `Just crushed a breathing session! Score: ${sessionScore}/100\n\n${stats.favoritePattern} pattern = instant zen mode activated\n\nFeeling centered, focused, and ready for anything\n\n#BreathingSuccess #MindfulMoment #StressRelief`,
        color: "bg-emerald-50 border-emerald-200 text-emerald-800",
        priority: "high",
        icon: "CheckCircle"
      });
    }
    
    return templates;
  }
}

export default PersonalizedTemplates;