import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Trophy, ArrowRight, Sparkles, Star, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface PostSessionCelebrationProps {
  metrics: {
    patternName: string;
    duration: number;
    score: number;
    cycles?: number;
    sessionType?: string;
    isFirstSession?: boolean;
    streak?: number;
  };
  onContinue?: () => void;
  onExplorePatterns?: () => void;
  onClose?: () => void;
}

export const PostSessionCelebration: React.FC<PostSessionCelebrationProps> = ({
  metrics,
  onContinue,
  onExplorePatterns,
  onClose,
}) => {
  const durationMinutes = Math.round(metrics.duration / 60);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 text-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center relative z-10"
          >
            <Trophy className="h-10 w-10 text-primary" />
          </motion.div>
        </div>
        
        <div className="space-y-2 px-4">
          <h2 className="text-3xl font-bold tracking-tight">
            {metrics.isFirstSession ? "Welcome to the Journey!" : "Incredible Session!"}
          </h2>
          <p className="text-lg text-muted-foreground">
            You've nurtured your focus for {durationMinutes} minutes with {metrics.patternName}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <StatItem 
          label="Focus Score" 
          value={metrics.score.toString()} 
          icon={<Star className="w-4 h-4 text-primary" />} 
          delay={0.1}
        />
        <StatItem 
          label="Streak" 
          value={`${metrics.streak || 1} Days`} 
          icon={<Flame className="w-4 h-4 text-orange-500" />} 
          delay={0.2}
          highlight
        />
        <StatItem 
          label="Total Cycles" 
          value={metrics.cycles?.toString() || "—"} 
          icon={<Sparkles className="w-4 h-4 text-teal-500" />} 
          delay={0.3}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 px-2">
        <Button 
          onClick={onContinue} 
          className="flex-1 btn-premium py-7 text-lg rounded-full"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Keep the Momentum
        </Button>
        <Button 
          onClick={onExplorePatterns} 
          variant="outline" 
          className="flex-1 glass-dark py-7 text-lg rounded-full border-primary/20 text-primary"
        >
          <ArrowRight className="h-5 w-5 mr-2" />
          Explore Trends
        </Button>
      </div>

      <p className="text-sm text-muted-foreground animate-pulse pb-4">
        Every breath is a new beginning.
      </p>
    </motion.div>
  );
};

function StatItem({ label, value, icon, delay, highlight }: { 
  label: string, 
  value: string, 
  icon: React.ReactNode, 
  delay: number,
  highlight?: boolean 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={highlight ? "border-primary/20 bg-primary/5" : "glass border-none"}>
        <CardContent className="pt-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            {icon}
            {label}
          </div>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
