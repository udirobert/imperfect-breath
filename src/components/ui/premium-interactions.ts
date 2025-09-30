/**
 * Premium Interactions Utility - Sophisticated User Experience
 *
 * PREMIUM AESTHETIC: Maintains luxurious, calming design ethos
 * CLEAN: Centralized interaction patterns for consistency
 * MODULAR: Reusable across all components
 * PERFORMANT: Lightweight, optimized feedback systems
 */

import { toast } from "sonner";

export interface PremiumInteractionConfig {
  haptic?: 'subtle' | 'gentle' | 'none';
  feedback?: {
    message?: string;
    duration?: number;
    position?: 'top-right' | 'bottom-center' | 'top-center';
  };
  animation?: 'fade' | 'scale' | 'none';
}

/**
 * PREMIUM HAPTIC FEEDBACK
 * Minimal, refined vibration patterns that don't disrupt meditation
 */
export const triggerPremiumHaptic = (type: 'subtle' | 'gentle' = 'subtle') => {
  if (!('vibrate' in navigator)) return;

  switch (type) {
    case 'gentle':
      navigator.vibrate([25]); // Soft confirmation
      break;
    case 'subtle':
    default:
      navigator.vibrate([15]); // Minimal touch feedback
  }
};

/**
 * ELEGANT TOAST NOTIFICATIONS
 * Sophisticated, non-intrusive feedback messages
 */
export const showPremiumFeedback = (
  message: string,
  options: {
    duration?: number;
    position?: 'top-right' | 'bottom-center' | 'top-center';
    type?: 'success' | 'info' | 'subtle';
  } = {}
) => {
  const {
    duration = 2500,
    position = 'bottom-center',
    type = 'subtle'
  } = options;

  const styles = {
    success: {
      background: 'rgba(248, 250, 252, 0.95)',
      color: '#1e293b',
      border: '1px solid #e2e8f0',
    },
    info: {
      background: 'rgba(248, 250, 252, 0.95)',
      color: '#334155',
      border: '1px solid #e2e8f0',
    },
    subtle: {
      background: 'rgba(248, 250, 252, 0.90)',
      color: '#64748b',
      border: '1px solid #f1f5f9',
    }
  };

  toast.success(message, {
    duration,
    position,
    style: {
      ...styles[type],
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    },
  });
};

/**
 * PREMIUM BUTTON INTERACTIONS
 * Sophisticated click handlers with integrated feedback
 */
export const createPremiumClickHandler = (
  action: () => void | Promise<void>,
  config: PremiumInteractionConfig = {}
) => {
  return async (event?: React.MouseEvent) => {
    // Trigger haptic feedback
    if (config.haptic && config.haptic !== 'none') {
      triggerPremiumHaptic(config.haptic);
    }

    // Show feedback message
    if (config.feedback?.message) {
      showPremiumFeedback(config.feedback.message, {
        duration: config.feedback.duration,
        position: config.feedback.position,
      });
    }

    // Execute the action
    try {
      await action();
    } catch (error) {
      console.error('Premium interaction error:', error);
    }
  };
};

/**
 * BREATHING-FOCUSED INTERACTIONS
 * Specialized interactions for meditation/wellness context
 */
export const breathingInteractions = {
  sessionStart: (callback: () => void) =>
    createPremiumClickHandler(callback, {
      haptic: 'gentle',
      feedback: {
        message: 'Preparing your session',
        duration: 2000,
        position: 'bottom-center'
      }
    }),

  sessionComplete: (callback: () => void) =>
    createPremiumClickHandler(callback, {
      haptic: 'gentle',
      feedback: {
        message: 'Session completed mindfully',
        duration: 3000,
        position: 'top-center'
      }
    }),

  communityJoin: (callback: () => void) =>
    createPremiumClickHandler(callback, {
      haptic: 'subtle',
      feedback: {
        message: 'Joining the community',
        duration: 2000,
      }
    }),

  progressSave: (callback: () => void) =>
    createPremiumClickHandler(callback, {
      haptic: 'subtle',
      feedback: {
        message: 'Progress saved',
        duration: 1500,
        position: 'top-right'
      }
    }),

  authRequired: (callback: () => void) =>
    createPremiumClickHandler(callback, {
      haptic: 'gentle',
      feedback: {
        message: 'Sign in to continue',
        duration: 2500,
      }
    }),
};

/**
 * PREMIUM ANIMATION CLASSES
 * Subtle, sophisticated animation utilities
 */
export const premiumAnimations = {
  // Gentle hover effects
  hover: 'transition-all duration-300 hover:scale-[1.02] hover:shadow-md',

  // Soft press feedback
  press: 'active:scale-[0.98] transition-transform duration-150',

  // Elegant fade transitions
  fade: 'transition-opacity duration-500',

  // Breathing-inspired pulse
  breathe: 'animate-pulse duration-4000',

  // Premium card elevation
  elevate: 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300',

  // Mindful loading states
  loading: 'animate-pulse duration-2000',
} as const;

/**
 * PREMIUM COLOR PALETTE
 * Sophisticated, calming colors that maintain luxury aesthetic
 */
export const premiumColors = {
  // Primary slate tones
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Accent colors for breathing context
  breathing: {
    calm: '#e2e8f0',      // Soft slate for calm states
    focus: '#cbd5e1',     // Medium slate for focused states
    success: '#475569',   // Darker slate for completion
    gentle: '#f8fafc',    // Lightest slate for gentle feedback
  },

  // Wellness-focused gradients
  gradients: {
    calming: 'from-slate-50 to-slate-100',
    focusing: 'from-slate-100 to-slate-200',
    completion: 'from-slate-700 to-slate-800',
    background: 'from-white via-slate-50 to-slate-100',
  }
} as const;

/**
 * PREMIUM SPACING SYSTEM
 * Consistent, harmonious spacing that promotes breathing room
 */
export const premiumSpacing = {
  // Component spacing
  xs: 'space-y-2',
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',

  // Padding utilities
  padding: {
    card: 'p-6',
    section: 'py-8 px-4',
    button: 'px-4 py-2',
    input: 'px-3 py-2',
  },

  // Margin utilities for breathing room
  margin: {
    section: 'mb-8',
    component: 'mb-6',
    element: 'mb-4',
  }
} as const;

/**
 * USAGE EXAMPLE:
 *
 * import { breathingInteractions, premiumAnimations, premiumColors } from '@/components/ui/premium-interactions';
 *
 * <Button
 *   onClick={breathingInteractions.sessionStart(() => startSession())}
 *   className={`${premiumAnimations.hover} ${premiumAnimations.press} bg-slate-800 text-white`}
 * >
 *   Begin Session
 * </Button>
 */
