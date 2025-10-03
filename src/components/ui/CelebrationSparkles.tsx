import React from 'react';
import { cn } from '../../lib/utils';

/**
 * CelebrationSparkles
 *
 * A subtle, premium micro‑animation that displays gentle sparkles.
 * Used to celebrate moments such as a high stillness score.
 *
 * CORE PRINCIPLES:
 * - ENHANCEMENT FIRST: Adds visual delight without affecting core logic
 * - CLEAN: Self‑contained component, no external side‑effects
 * - MODULAR: Can be placed anywhere in the UI
 * - PERFORMANT: Uses only CSS animations, no heavy JS
 */
export const CelebrationSparkles: React.FC<{
  /** Controls visibility – true shows the animation */
  visible: boolean;
  /** Optional className for positioning */
  className?: string;
}> = ({ visible, className }) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 pointer-events-none flex items-center justify-center',
        className
      )}
    >
      {/* Sparkle container */}
      <div className="relative w-32 h-32">
        {/* Sparkle 1 */}
        <div className="sparkle absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full opacity-0 animate-sparkle-1" />
        {/* Sparkle 2 */}
        <div className="sparkle absolute bottom-0 right-1/4 w-3 h-3 bg-white rounded-full opacity-0 animate-sparkle-2" />
        {/* Sparkle 3 */}
        <div className="sparkle absolute top-1/3 left-0 w-2.5 h-2.5 bg-white rounded-full opacity-0 animate-sparkle-3" />
        {/* Sparkle 4 */}
        <div className="sparkle absolute bottom-1/4 right-0 w-2 h-2 bg-white rounded-full opacity-0 animate-sparkle-4" />
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes sparkleFade {
          0% { opacity: 0; transform: scale(0.5); }
          30% { opacity: 0.8; transform: scale(1); }
          70% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        .animate-sparkle-1 { animation: sparkleFade 1.2s ease-out forwards; animation-delay: 0s; }
        .animate-sparkle-2 { animation: sparkleFade 1.2s ease-out forwards; animation-delay: 0.2s; }
        .animate-sparkle-3 { animation: sparkleFade 1.2s ease-out forwards; animation-delay: 0.4s; }
        .animate-sparkle-4 { animation: sparkleFade 1.2s ease-out forwards; animation-delay: 0.6s; }
      `}</style>
    </div>
  );
};

export default CelebrationSparkles;
