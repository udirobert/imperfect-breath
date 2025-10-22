// Predefined educational content for common metrics
export const MetricTooltips = {
  stillness: {
    title: "Stillness Score",
    description: "Measures how steady your head and body position remain during meditation. Higher scores indicate less physical movement.",
    tip: "Try to find a comfortable position and gently minimize head movements for better scores."
  },
  presence: {
    title: "Presence Score", 
    description: "Indicates how consistently your face is detected and tracked by the camera. Higher scores mean better camera positioning.",
    tip: "Ensure good lighting and keep your face centered in the camera view."
  },
  confidence: {
    title: "Detection Confidence",
    description: "Technical measure of how accurately the AI can detect your facial features. Higher values indicate clearer tracking.",
    tip: "Good lighting and a stable camera position improve detection confidence."
  },
  breathingPhase: {
    title: "Breathing Phase",
    description: "Current stage of your breathing cycle. Follow the visual guide to maintain proper rhythm and timing.",
    tip: "Focus on smooth transitions between phases rather than forcing the timing."
  },
  cycle: {
    title: "Breathing Cycle",
    description: "Number of complete breath sequences you've completed. Each cycle includes inhale, hold, exhale, and pause phases.",
    tip: "Consistency matters more than speed - focus on quality over quantity."
  },
  progress: {
    title: "Session Progress",
    description: "Percentage of your planned session duration completed. Based on your selected pattern and target time.",
    tip: "Sessions become more beneficial with consistent daily practice."
  }
};