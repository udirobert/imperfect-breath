
import React from 'react';

interface BreathingAnimationProps {
  phase: 'inhale' | 'hold' | 'exhale';
  text: string;
}

const BreathingAnimation = ({ phase, text }: BreathingAnimationProps) => {
  // This is a simplified animation. In a real app, the duration and timing
  // would be precisely controlled by the session logic.
  const animationStyle = {
    animationDuration: phase === 'hold' ? '2s' : '4s',
  };

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
      <div 
        className="absolute w-full h-full rounded-full bg-primary/20 animate-breathe"
        style={{...animationStyle, animationDelay: '0s'}}
      />
      <div 
        className="absolute w-full h-full rounded-full bg-primary/20 animate-breathe"
        style={{...animationStyle, animationDelay: '2s'}}
      />
      <div className="z-10 text-center">
        <p className="text-2xl font-bold text-primary">{text}</p>
      </div>
    </div>
  );
};

export default BreathingAnimation;
