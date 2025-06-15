
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Clock, Activity } from 'lucide-react';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const Results = () => {
  const location = useLocation();
  const sessionData = location.state || {};

  const stats = [
    {
      title: 'Max Breath Hold',
      value: sessionData?.breathHoldTime ? formatTime(sessionData.breathHoldTime) : 'N/A',
      icon: <Clock className="w-6 h-6 text-primary" />,
      description: sessionData?.breathHoldTime && sessionData.breathHoldTime > 0 ? 'Great focus! Try to relax your shoulders more.' : 'Breath hold was not part of this session.',
    },
    {
      title: 'Restlessness Score',
      value: typeof sessionData.restlessnessScore === 'number' ? `${Math.round(sessionData.restlessnessScore)}/100` : 'N/A',
      icon: <Activity className="w-6 h-6 text-primary" />,
      description: typeof sessionData.restlessnessScore !== 'number' 
        ? 'Movement tracking was not active for this session.'
        : (sessionData.restlessnessScore < 20 
            ? 'Very calm session. Minimal movement detected.' 
            : 'Some movement was detected. Try finding a more comfortable, stable position next time.'),
    },
    {
      title: 'Session Consistency',
      value: '92%',
      icon: <BarChart className="w-6 h-6 text-primary" />,
      description: 'Your breathing was very rhythmic and consistent.',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center animate-fade-in">
      <h1 className="text-4xl font-bold mb-2">Session Complete</h1>
      <p className="text-muted-foreground mb-8">Take a moment to notice how you feel.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl">
        {stats.map((stat, index) => (
          <Card key={index} className="text-left animate-fade-in" style={{animationDelay: `${index * 200}ms`, opacity: 0}}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Link to="/">
        <Button size="lg" className="rounded-full shadow-lg">Back to Home</Button>
      </Link>
    </div>
  );
};

export default Results;
