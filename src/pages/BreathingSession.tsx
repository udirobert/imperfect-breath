
import React, { useState, useEffect } from 'react';
import BreathingAnimation from '@/components/BreathingAnimation';
import VideoFeed from '@/components/VideoFeed';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Pause, Play, StopCircle } from 'lucide-react';

// TODO: This logic should be moved to a custom hook (e.g., useBreathingSession)
const BreathingSession = () => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('Breathe In...');
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    // This is a simplified box breathing cycle (4s in, 4s hold, 4s out)
    // A real implementation would allow for different patterns (Wim Hof, etc.)
    const cycle = [
      { phase: 'inhale', text: 'Breathe In...', duration: 4000 },
      { phase: 'hold', text: 'Hold', duration: 4000 },
      { phase: 'exhale', text: 'Breathe Out...', duration: 4000 },
      { phase: 'hold', text: 'Hold', duration: 4000 },
    ];
    
    let currentIndex = 0;
    
    const nextPhase = () => {
      const current = cycle[currentIndex];
      setPhase(current.phase as any);
      setText(current.text);
      currentIndex = (currentIndex + 1) % cycle.length;
    };

    nextPhase(); // Initial call
    const intervalId = setInterval(nextPhase, 4000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center w-full relative animate-fade-in">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <BreathingAnimation phase={phase} text={text} />
      </div>
      
      <div className="z-20 mt-auto mb-8 flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => setIsRunning(!isRunning)} className="rounded-full w-16 h-16">
          {isRunning ? <Pause size={32} /> : <Play size={32} />}
        </Button>
        <Link to="/results">
          <Button variant="destructive" size="icon" className="rounded-full w-16 h-16 bg-red-400 hover:bg-red-500">
            <StopCircle size={32} />
          </Button>
        </Link>
      </div>

      <VideoFeed />
    </div>
  );
};

export default BreathingSession;
