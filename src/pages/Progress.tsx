import React from 'react';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LineChart, Line, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Clock, Activity, Zap, HeartPulse } from 'lucide-react';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const Progress = () => {
  const { history, streak, totalMinutes, longestBreathHold, averageRestlessness, preferredPattern } = useSessionHistory();

  const chartData = history.map(session => ({
    date: format(parseISO(session.created_at), 'MMM d'),
    'Breath Hold': session.breath_hold_time,
    'Restlessness': session.restlessness_score,
  })).slice(-30);

  const chartConfig: ChartConfig = {
    'Breath Hold': {
      label: 'Breath Hold (s)',
      color: 'hsl(var(--primary))',
    },
    'Restlessness': {
      label: 'Restlessness',
      color: 'hsl(var(--destructive))',
    },
  };

  const stats = [
    { title: 'Current Streak', value: `${streak} Day${streak === 1 ? '' : 's'}`, icon: <Star className="w-6 h-6 text-primary" /> },
    { title: 'Total Mindful Minutes', value: `${totalMinutes} min`, icon: <Clock className="w-6 h-6 text-primary" /> },
    { title: 'Longest Breath Hold', value: formatTime(longestBreathHold), icon: <Activity className="w-6 h-6 text-primary" /> },
    { title: 'Avg. Restlessness', value: `${averageRestlessness}/100`, icon: <Zap className="w-6 h-6 text-primary" /> },
    { title: 'Favorite Rhythm', value: preferredPattern, icon: <HeartPulse className="w-6 h-6 text-primary" /> },
  ];

  if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center animate-fade-in p-4 h-full">
            <h2 className="text-2xl font-bold mb-4">No progress yet.</h2>
            <p className="text-muted-foreground mb-8">Complete a session to start tracking your progress!</p>
            <Button asChild><Link to="/session">Start First Session</Link></Button>
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center animate-fade-in p-4 space-y-8">
      <h1 className="text-4xl font-bold">My Progress</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-5xl">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center flex flex-col items-center justify-center p-4">
            <CardHeader className="p-0 mb-2">{stat.icon}</CardHeader>
            <CardContent className="p-0">
              <p className="text-xs text-muted-foreground">{stat.title}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Breath Hold Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} unit="s" />
              <Tooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="Breath Hold" stroke="var(--color-Breath Hold)" strokeWidth={2} dot={true} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle>Restlessness Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="Restlessness" fill="var(--color-Restlessness)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link to="/">Back to Home</Link>
      </Button>

    </div>
  );
};

export default Progress;
