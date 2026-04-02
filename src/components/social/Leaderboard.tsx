import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Flame, Clock, Award, TrendingUp, Users, Heart, ArrowUpRight } from "lucide-react";
import { leaderboardService, type LeaderboardEntry } from "@/services/social/LeaderboardService";
import { motion, AnimatePresence } from "framer-motion";
import { useLens } from "@/hooks/useLens";
import { Button } from "@/components/ui/button";

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentAccount } = useLens();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const data = await leaderboardService.getLeaderboard();
      setEntries(data);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="h-12 w-12 text-primary/20" />
        </motion.div>
        <p className="text-muted-foreground animate-pulse">Calculating rankings...</p>
      </div>
    );
  }

  return (
    <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/10">
      <CardHeader className="relative overflow-hidden pb-2">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
              Community Leaderboard
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 font-medium">
              <Users className="h-3.5 w-3.5 text-primary" />
              Verified Breathing Circle
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary animate-pulse">
            LIVE
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-6 pb-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {entries.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No sessions shared yet on Lens.</p>
                <p className="text-xs text-muted-foreground/60">Complete a session and share to claim your spot!</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <motion.div
                  key={entry.address}
                  variants={itemVariants}
                  className={`group relative flex items-center p-4 rounded-2xl transition-all duration-300 hover:bg-white/10 border border-transparent ${
                    entry.address === currentAccount?.address 
                      ? "bg-primary/10 border-primary/20 ring-1 ring-primary/20" 
                      : "bg-white/5"
                  }`}
                >
                  {/* Rank Indicator */}
                  <div className="flex-shrink-0 w-8 flex items-center justify-center font-bold text-lg">
                    {index === 0 ? (
                      <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    ) : index === 1 ? (
                      <Award className="h-6 w-6 text-slate-300" />
                    ) : index === 2 ? (
                      <Award className="h-6 w-6 text-amber-600" />
                    ) : (
                      <span className="text-muted-foreground/60 text-sm">#{entry.rank}</span>
                    )}
                  </div>

                  <Avatar className="h-12 w-12 ml-4 border-2 border-background ring-2 ring-white/10 transition-transform group-hover:scale-105">
                    <AvatarImage src={entry.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-sm">
                      {entry.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="ml-4 flex-1 min-w-0">
                    <p className="font-bold truncate flex items-center gap-2">
                      {entry.username}
                      {entry.address === currentAccount?.address && (
                        <Badge variant="secondary" className="h-4 text-[10px] uppercase tracking-tighter bg-primary/20 text-primary hover:bg-primary/30">You</Badge>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {Math.round(entry.totalDuration / 60)}m
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-primary whitespace-nowrap">
                        <Heart className="h-3 w-3 fill-primary/10" />
                        {entry.totalScore} pts
                      </span>
                    </div>
                  </div>

                  {/* Streak and Action */}
                  <div className="ml-4 flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full border border-orange-500/20">
                      <Flame className="h-3 w-3 fill-orange-500" />
                      <span className="text-[11px] font-bold">{entry.streak}d</span>
                    </div>
                    {entry.address !== currentAccount?.address && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
