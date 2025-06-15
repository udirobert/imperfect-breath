
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart, Clock, Activity } from 'lucide-react';

const Results = () => {
  // TODO: Replace with actual data from the session
  const stats = [
    {
      title: 'Max Breath Hold',
      value: '45s',
      icon: <Clock className="w-6 h-6 text-primary" />,
      description: 'Great focus! Try to relax your shoulders more.',
    },
    {
      title: 'Restlessness Score',
      value: '23/100',
      icon: <Activity className="w-6 h-6 text-primary" />,
      description: 'Very calm session. Minimal movement detected.',
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
