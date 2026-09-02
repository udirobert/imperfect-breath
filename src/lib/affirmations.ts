/**
 * Session copy is the phase word on the orb.
 * These stay as quiet fallbacks if anything still asks.
 */

export interface Affirmation {
  text: string;
  category: "presence";
}

const HERE: Affirmation = { text: "", category: "presence" };

export function getAffirmationForCycle(_cycleCount: number): Affirmation {
  return HERE;
}

export function getAffirmationByCategory(_category: string): Affirmation {
  return HERE;
}

export function getProgressAffirmation(_progressPercentage: number): Affirmation {
  return HERE;
}

export function getStillnessAffirmation(_stillnessScore: number): Affirmation {
  return HERE;
}
