import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Activity,
  Star,
  Share,
  Brain,
  Shield,
  Loader2,
  CheckCircle,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { LensIntegratedSocialFlow } from "@/components/social/LensIntegratedSocialFlow";

interface EnhancedSessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    patternName: string;
    duration: number;
    breathHoldTime: number;
    restlessnessScore: number;
  };
  onShare: () => void;
  onAIAnalysis: () => void;
  onRegisterIP: () => void;
  isRegisteringIP: boolean;
  ipRegistered: boolean;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

export const EnhancedSessionCompleteModal: React.FC<
  EnhancedSessionCompleteModalProps
> = ({
  isOpen,
  onClose,
  sessionData,
  onShare,
  onAIAnalysis,
  onRegisterIP,
  isRegisteringIP,
  ipRegistered,
}) => {
  const restlessnessValue = Math.round(sessionData.restlessnessScore || 0);
  const score = Math.max(0, 100 - restlessnessValue); // Convert restlessness to score

  const handleSocialAction = (action: string, data: any) => {
    console.log("Social action:", action, data);
    if (action === "shared") {
      onClose(); // Close modal after successful share
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            🌬️ Session Complete!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">
                  {formatTime(sessionData.duration)}
                </p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{score}%</p>
                <p className="text-sm text-muted-foreground">Focus Score</p>
              </CardContent>
            </Card>
          </div>

          {/* Pattern Info */}
          <div className="text-center">
            <Badge variant="outline" className="mb-2">
              {sessionData.patternName}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Great job completing your breathing session!
            </p>
          </div>

          {/* Lens Integrated Social Flow */}
          <LensIntegratedSocialFlow
            phase="completion"
            sessionData={{
              patternName: sessionData.patternName,
              duration: sessionData.duration,
              score,
              insights: [
                `Completed ${sessionData.patternName} with ${score}% focus`,
              ],
            }}
            onSocialAction={handleSocialAction}
          />

          {/* Traditional Action Buttons */}
          <div className="space-y-3 border-t pt-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onAIAnalysis} variant="outline" size="sm">
                <Brain className="mr-2 h-4 w-4" />
                AI Analysis
              </Button>

              {!ipRegistered ? (
                <Button
                  onClick={onRegisterIP}
                  variant="outline"
                  size="sm"
                  disabled={isRegisteringIP}
                >
                  {isRegisteringIP ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  {isRegisteringIP ? "Registering..." : "Protect IP"}
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  IP Protected
                </Button>
              )}
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 rounded-xl shadow-lg transition-all duration-200"
            >
              Continue Your Journey
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
