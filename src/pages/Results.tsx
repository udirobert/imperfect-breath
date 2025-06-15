
import React, { useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Activity, Star, Share } from 'lucide-react';
import { BREATHING_PATTERNS } from '@/lib/breathingPatterns';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const Results = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { streak, totalMinutes, saveSession } = useSessionHistory();
  const hasSavedRef = useRef(false);

  const sessionData = location.state || {};

  useEffect(() => {
    if (sessionData.patternName && !hasSavedRef.current && user) {
        try {
            saveSession({
              breathHoldTime: sessionData.breathHoldTime || 0,
              restlessnessScore: sessionData.restlessnessScore || 0,
              sessionDuration: sessionData.sessionDuration || 0,
              patternName: sessionData.patternName,
            });
            toast.success("Session saved successfully!");
            hasSavedRef.current = true;
        } catch (error) {
            console.error("Failed to save session", error);
            toast.error("Could not save your session. Please try again.");
        }
    }
  }, [sessionData, saveSession, user]);

  const restlessnessValue = Math.round(sessionData.restlessnessScore || 0);
  const restlessnessColor = restlessnessValue < 20 ? 'bg-green-500' : restlessnessValue < 50 ? 'bg-yellow-500' : 'bg-red-500';

  const handleShare = async () => {
    const summary = `I just completed a mindful breathing session!
- Max Breath Hold: ${formatTime(sessionData.breathHoldTime || 0)}
- Restlessness Score: ${restlessnessValue}/100
Check out Mindful Breath!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Mindful Breath Results',
          text: summary,
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast.error('Could not share results.');
      }
    } else {
      navigator.clipboard.writeText(summary);
      toast.success('Results copied to clipboard!');
    }
  };

  const stats = [
    {
      title: 'Max Breath Hold',
      value: sessionData?.breathHoldTime ? formatTime(sessionData.breathHoldTime) : 'N/A',
      icon: <Clock className="w-6 h-6 text-primary" />,
      description: 'Your longest hold in this session.',
    },
    {
      title: 'Restlessness Score',
      value: typeof sessionData.restlessnessScore === 'number' ? `${restlessnessValue}/100` : 'N/A',
      icon: <Activity className="w-6 h-6 text-primary" />,
      description: 'Lower is calmer. Great job staying still!',
      content: typeof sessionData.restlessnessScore === 'number' && <Progress value={restlessnessValue} indicatorClassName={restlessnessColor} className="h-2" />,
    },
    {
      title: 'Consecutive Days',
      value: `${streak} Day${streak === 1 ? '' : 's'}`,
      icon: <Star className="w-6 h-6 text-primary" />,
      description: 'You\'re building a healthy habit!',
    },
    {
      title: 'Total Mindful Minutes',
      value: `${totalMinutes} min`,
      icon: <Clock className="w-6 h-6 text-primary" />,
      description: 'Total time invested in your wellbeing.',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in p-4">
      <h1 className="text-4xl font-bold mb-2">Session Complete</h1>
      <p className="text-muted-foreground mb-8">Take a moment to notice how you feel.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-4xl">
        {stats.map((stat, index) => (
          <Card key={index} className="text-left animate-fade-in" style={{animationDelay: `${index * 150}ms`, opacity: 0}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.content}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Link to="/">
          <Button size="lg" className="rounded-full shadow-lg">Back to Home</Button>
        </Link>
        <Button size="lg" variant="outline" className="rounded-full shadow-lg" onClick={handleShare} disabled={!sessionData.patternName}>
          <Share className="mr-2 h-5 w-5" />
          Share Results
        </Button>
      </div>
    </div>
  );
};

export default Results;
