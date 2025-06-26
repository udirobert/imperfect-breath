/**
 * Helper functions and examples for creating breathing phases correctly
 */

import { createBreathingPhase, createCustomPhase, isValidPhaseName, type BreathingPhaseName } from "./breathingPatterns";

// Example: Create a standard breathing phase (restricted to known phase names)
export const createStandardInhalePhase = () => 
  createBreathingPhase('inhale', 4000, 'Breathe In...', 'Take a slow, deep breath through your nose');

export const createStandardExhalePhase = () => 
  createBreathingPhase('exhale', 4000, 'Breathe Out...', 'Release the air slowly through your mouth');

// Example: Create custom phases for user-defined patterns
export const createCustomInstructionalPhase = (name: string, duration: number, instruction: string) => 
  createCustomPhase(name, duration, instruction, instruction);

// Helper to safely convert a string to a phase name
export const safeCreatePhase = (name: string, duration: number, text: string, instruction?: string) => {
  if (isValidPhaseName(name)) {
    // Use the strict type
    return createBreathingPhase(name, duration, text, instruction);
  } else {
    // Use the flexible type for custom patterns
    return createCustomPhase(name, duration, text, instruction);
  }
};

// Example usage for fixing "New Phase" error:
// Instead of: { name: "New Phase", duration: 4000, text: "Custom instruction" }
// Use: createCustomPhase("New Phase", 4000, "Custom instruction")

// Or for standard phases:
// createBreathingPhase('inhale', 4000, 'Breathe In')

export const exampleCustomPattern = {
  id: 'example-1',
  name: 'Example Custom Pattern',
  description: 'A sample pattern showing correct usage',
  phases: [
    createCustomPhase('Preparation', 3000, 'Get ready...', 'Find a comfortable position'),
    createCustomPhase('Deep Inhale', 6000, 'Breathe in deeply', 'Fill your lungs completely'),
    createCustomPhase('Hold', 2000, 'Hold your breath', 'Maintain the breath gently'),
    createCustomPhase('Slow Exhale', 8000, 'Breathe out slowly', 'Release the air gradually'),
  ],
  category: 'stress' as const,
  difficulty: 'beginner' as const,
  duration: 19, // total seconds
  creator: 'example-user'
};