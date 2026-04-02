import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Wind, 
  Video, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    title: "Welcome to Stillness",
    description: "Imperfect Breath is your space for conscious breathing and mental clarity.",
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    color: "bg-primary/10"
  },
  {
    title: "AI Analysis",
    description: "We use privacy-first vision processing to analyze your posture and breathing patterns in real-time.",
    icon: <Video className="w-12 h-12 text-blue-500" />,
    color: "bg-blue-50"
  },
  {
    title: "Social Accountability",
    description: "Connect with the Lens ecosystem to share your progress and build consistent habits with a community.",
    icon: <Users className="w-12 h-12 text-teal-500" />,
    color: "bg-teal-50"
  },
  {
    title: "Privacy First",
    description: "Your biometric data never leaves your device. We use SIWE and decentralized storage for total control.",
    icon: <ShieldCheck className="w-12 h-12 text-green-500" />,
    color: "bg-green-50"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/auth?context=onboarding");
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-calm-gradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="glass border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
              <div className="p-10 space-y-8 text-center">
                <div className={`w-24 h-24 ${STEPS[currentStep].color} rounded-[2rem] flex items-center justify-center mx-auto animate-float`}>
                  {STEPS[currentStep].icon}
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    {STEPS[currentStep].title}
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {STEPS[currentStep].description}
                  </p>
                </div>

                <div className="pt-6 flex items-center gap-4">
                  {currentStep > 0 && (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={prevStep}
                      className="rounded-full px-6"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back
                    </Button>
                  )}
                  
                  <Button
                    size="lg"
                    onClick={nextStep}
                    className="flex-1 btn-premium py-8 text-lg rounded-full"
                  >
                    {currentStep === STEPS.length - 1 ? "Initialize Account" : "Continue"}
                    {currentStep < STEPS.length - 1 && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-sm text-muted-foreground pt-4">
          By continuing, you agree to our <a href="/terms" className="underline underline-offset-4">Terms of Service</a>.
        </p>
      </div>
    </div>
  );
}
