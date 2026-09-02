import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { TodayCard } from "@/components/home/TodayCard";
import { WordReveal, type WordPart } from "@/components/atmosphere/WordReveal";
import { useSessionHistory } from "@/hooks/useSessionHistory";

export default function Index() {
  const { user } = useAuth();
  const { streak } = useSessionHistory();
  const isGuest = !user;
  const reduceMotion = useReducedMotion();

  const headline = useMemo((): WordPart[] => {
    if (!isGuest && streak > 0) {
      return [`Day ${streak}. Keep it breathing.`];
    }
    if (isGuest) {
      return [
        "Breathe ",
        { text: "better.", className: "text-gradient" },
        " Prove ",
        { text: "it.", className: "text-gradient" },
      ];
    }
    return ["Welcome back."];
  }, [isGuest, streak]);

  return (
    <div className="w-full flex flex-col items-center px-2">
      <div className="relative text-center space-y-2 max-w-2xl">
        <WordReveal
          parts={headline}
          className="text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]"
        />
        <motion.p
          className="text-muted-foreground max-w-md mx-auto"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {streak > 0
            ? "One check-in, one session — that's the whole practice."
            : "Tap how you feel. Brume picks the breath."}
        </motion.p>
      </div>

      <motion.div
        className="mt-10 flex justify-center w-full"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
      >
        <TodayCard />
      </motion.div>

      {isGuest && (
        <motion.div
          className="mt-10 text-center space-y-2"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/auth?redirect=/"
              className="font-semibold text-primary hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs text-muted-foreground/60">
            Camera-verified · Video never leaves your phone
          </p>
        </motion.div>
      )}
    </div>
  );
}
