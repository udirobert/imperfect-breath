import React from "react";
import { Leaderboard } from "@/components/social/Leaderboard";
import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function LeaderboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent pb-20 pt-10">
      <div className="container max-w-2xl mx-auto px-4 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
          >
            <Trophy className="h-8 w-8" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black tracking-tight"
          >
            Social <span className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Accountability</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-md mx-auto"
          >
            Connect with the community, keep your streaks alive, and prove your consistency with Lens V3.
          </motion.p>
        </div>

        {/* Accountability Perks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Verified", desc: "Signed proofs" },
            { icon: TrendingUp, title: "Streaks", desc: "Keep it going" },
            { icon: Star, title: "Rewards", desc: "Earn on-chain" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1"
            >
              <item.icon className="h-5 w-5 mx-auto text-primary" />
              <p className="font-bold text-sm tracking-tight">{item.title}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Leaderboard */}
        <div className="space-y-6">
          <Leaderboard />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-1 z-10">
              <h3 className="font-bold text-lg">Ready to climb?</h3>
              <p className="text-sm text-muted-foreground">Start a session now and share your results to appear here.</p>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate("/")}
              className="z-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-full px-8 transition-all hover:scale-105 active:scale-95"
            >
              Start Breathing
            </Button>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
