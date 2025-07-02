import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BreathingSessionPost } from '@/components/social/BreathingSessionPost';
import { 
  Trophy, 
  Clock, 
  Target, 
  Repeat, 
  Wind, 
  TrendingUp,
  Share2,
  Award,
  CheckCircle
} from 'lucide-react';
import type { BreathingSessionData } from '@/services/LensService';

interface SessionData {
  patternName: string;
  duration: number; // in seconds
  score: number; // 0-100
  cycles?: number;
  breathHoldTime?: number;
  restlessnessScore?: number;
  flowNFTId?: string;
}

interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionData;
  onContinue?: () => void;
}

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  onContinue
}) => {
  const [activeTab, setActiveTab] = useState('results');
  const [isShared, setIsShared] = useState(false);

  const duration = Math.round(sessionData.duration / 60);
  const durationText = duration === 1 ? '1 minute' : `${duration} minutes`;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { text: 'Excellent', variant: 'default' as const };
    if (score >= 80) return { text: 'Great', variant: 'default' as const };
    if (score >= 70) return { text: 'Good', variant: 'secondary' as const };
    if (score >= 60) return { text: 'Fair', variant: 'secondary' as const };
    return { text: 'Keep Practicing', variant: 'outline' as const };
  };

  const scoreBadge = getScoreBadge(sessionData.score);

  const handleSessionShared = (txHash: string) => {
    setIsShared(true);
    console.log('Session shared to Lens:', txHash);
  };

  const lensSessionData: BreathingSessionData = {
    patternName: sessionData.patternName,
    duration: sessionData.duration,
    score: sessionData.score,
    cycles: sessionData.cycles,
    breathHoldTime: sessionData.breathHoldTime,
    flowNFTId: sessionData.flowNFTId,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Session Complete!
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
              {isShared && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            {/* Session Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{sessionData.patternName}</span>
                  <Badge variant={scoreBadge.variant} className="text-lg px-3 py-1">
                    {scoreBadge.text}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{durationText}</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(sessionData.score)}`}>
                      {sessionData.score}/100
                    </div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>

                  {sessionData.cycles && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Repeat className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">{sessionData.cycles}</div>
                      <div className="text-sm text-muted-foreground">Cycles</div>
                    </div>
                  )}

                  {sessionData.breathHoldTime && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Wind className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-2xl font-bold">{sessionData.breathHoldTime}s</div>
                      <div className="text-sm text-muted-foreground">Breath Hold</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionData.score >= 80 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Excellent Session!</p>
                        <p className="text-sm text-green-700">
                          You maintained great focus and consistency throughout your practice.
                        </p>
                      </div>
                    </div>
                  )}

                  {sessionData.restlessnessScore !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Movement Stability:</span>
                      <span className="font-medium">
                        {100 - sessionData.restlessnessScore}% stable
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Session Length:</span>
                    <span className="font-medium">
                      {duration >= 5 ? 'Great duration!' : 'Try extending next time'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Flow NFT Info */}
            {sessionData.flowNFTId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Flow NFT:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {sessionData.flowNFTId}
                    </code>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <BreathingSessionPost 
              sessionData={lensSessionData}
              onPublished={handleSessionShared}
            />
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {onContinue && (
            <Button onClick={onContinue} className="flex-1">
              Continue Practicing
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};