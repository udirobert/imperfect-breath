/**
 * Breathing Affirmations & Quotes System
 * 
 * CORE PRINCIPLES:
 * - MODULAR: Separate affirmation logic from UI
 * - CLEAN: Clear categorization and selection logic
 * - ENHANCEMENT FIRST: Enhances meditation experience without distraction
 */

export interface Affirmation {
    text: string;
    category: 'presence' | 'calm' | 'strength' | 'gratitude' | 'encouragement';
}

const affirmations: Affirmation[] = [
    // Presence
    { text: 'You are here, you are present', category: 'presence' },
    { text: 'This moment is all there is', category: 'presence' },
    { text: 'Your breath anchors you to now', category: 'presence' },
    { text: 'Be here, be still, be whole', category: 'presence' },
    { text: 'Right here, right now, you are enough', category: 'presence' },

    // Calm
    { text: 'With each breath, you find peace', category: 'calm' },
    { text: 'Stillness lives within you', category: 'calm' },
    { text: 'You are calm, you are centered', category: 'calm' },
    { text: 'Peace flows through you naturally', category: 'calm' },
    { text: 'Your breath brings you home', category: 'calm' },

    // Strength
    { text: 'You are stronger than you know', category: 'strength' },
    { text: 'Each breath builds your resilience', category: 'strength' },
    { text: 'You have everything you need within', category: 'strength' },
    { text: 'Your breath is your power', category: 'strength' },
    { text: 'You are capable and whole', category: 'strength' },

    // Gratitude
    { text: 'Thank you for this moment', category: 'gratitude' },
    { text: 'Grateful for this breath, this life', category: 'gratitude' },
    { text: 'Each breath is a gift', category: 'gratitude' },
    { text: 'You are blessed, you are alive', category: 'gratitude' },
    { text: 'Gratitude fills your being', category: 'gratitude' },

    // Encouragement
    { text: 'Beautiful breathing', category: 'encouragement' },
    { text: 'You\'re doing wonderfully', category: 'encouragement' },
    { text: 'Stay with it, you\'ve got this', category: 'encouragement' },
    { text: 'Every breath matters', category: 'encouragement' },
    { text: 'Keep going, you\'re amazing', category: 'encouragement' },
];

/**
 * Get a rotating affirmation based on cycle count
 */
export function getAffirmationForCycle(cycleCount: number): Affirmation {
    const index = cycleCount % affirmations.length;
    return affirmations[index];
}

/**
 * Get a random affirmation from a specific category
 */
export function getAffirmationByCategory(category: Affirmation['category']): Affirmation {
    const categoryAffirmations = affirmations.filter(a => a.category === category);
    const randomIndex = Math.floor(Math.random() * categoryAffirmations.length);
    return categoryAffirmations[randomIndex];
}

/**
 * Get affirmation based on session progress
 */
export function getProgressAffirmation(progressPercentage: number): Affirmation {
    if (progressPercentage < 25) {
        return getAffirmationByCategory('presence');
    } else if (progressPercentage < 50) {
        return getAffirmationByCategory('calm');
    } else if (progressPercentage < 75) {
        return getAffirmationByCategory('strength');
    } else {
        return getAffirmationByCategory('encouragement');
    }
}

/**
 * Get affirmation based on stillness score
 */
export function getStillnessAffirmation(stillnessScore: number): Affirmation {
    if (stillnessScore >= 80) {
        return { text: 'Perfect stillness, perfect peace', category: 'encouragement' };
    } else if (stillnessScore >= 60) {
        return { text: 'Finding your center beautifully', category: 'encouragement' };
    } else if (stillnessScore >= 40) {
        return { text: 'Gently return to stillness', category: 'calm' };
    } else {
        return { text: 'Be gentle with yourself', category: 'calm' };
    }
}
