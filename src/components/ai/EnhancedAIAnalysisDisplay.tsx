/**
 * Enhanced AI Analysis Display Component
 * 
 * Premium UI component for displaying sophisticated AI breathing analysis
 * with scientific insights, pattern expertise, and interactive elements.
 */

import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  Brain,
  Microscope,
  Target,
  TrendingUp,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Award,
  Activity,
  Stethoscope,
  Send,
  Loader2,
  User,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'dr_breathe';
  content: string;
  timestamp: string;
}

interface EnhancedAIAnalysisProps {
  analysis: {
    provider: string;
    providerDisplayName?: string;
    analysis: string;
    suggestions: string[];
    nextSteps: string[];
    score: {
      overall: number;
      focus: number;
      consistency: number;
      progress: number;
    };
    // Enhanced fields
    scientificInsights?: string;
    patternSpecificGuidance?: string;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    encouragement?: string;
    followUpQuestions?: string[];
    progressTrends?: string[];
  };
  patternName: string;
  onSendChatMessage?: (message: string) => Promise<string>;
}

const getExperienceLevelConfig = (level: string) => {
  switch (level) {
    case 'advanced':
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '🏆',
        label: 'Advanced Practitioner'
      };
    case 'intermediate':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🎯',
        label: 'Intermediate'
      };
    default:
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🌱',
        label: 'Beginner'
      };
  }
};

const getScoreBadgeVariant = (score: number) => {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
};

export const EnhancedAIAnalysisDisplay: React.FC<EnhancedAIAnalysisProps> = ({
  analysis,
  patternName,
  onSendChatMessage
}) => {
  const [showQuestions, setShowQuestions] = useState(false);
  const [showScientificDetails, setShowScientificDetails] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatInputRef = useRef<HTMLInputElement>(null);
  
  const experienceConfig = getExperienceLevelConfig(analysis.experienceLevel || 'beginner');

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);
    
    // Add user message
    const newUserMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    
    try {
      // Get Dr. Breathe's response
      let drBreatheResponse = "Thank you for your question! I'm here to help you on your breathing journey. Could you tell me more about what specific aspect of your practice you'd like to explore?";
      
      if (onSendChatMessage) {
        drBreatheResponse = await onSendChatMessage(userMessage);
      }
      
      // Add Dr. Breathe's response
      const drMessage: ChatMessage = {
        id: `msg_${Date.now()}_dr`,
        role: 'dr_breathe',
        content: `${drBreatheResponse}\n\n— Dr. Breathe, Your Breathing Coach`,
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, drMessage]);
      
    } catch (error) {
      console.error('Failed to get Dr. Breathe response:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}_dr`,
        role: 'dr_breathe',
        content: "I appreciate your question! While I'm having a moment of technical difficulty, I want you to know that every question about your breathing practice is valuable. Please feel free to ask again.\n\n— Dr. Breathe, Your Breathing Coach",
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsChatLoading(false);
      chatInputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Dr. Breathe's Analysis
            </CardTitle>
            {analysis.experienceLevel && (
              <Badge className={`${experienceConfig.color} font-medium`}>
                {experienceConfig.icon} {experienceConfig.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Encouragement Message */}
          {analysis.encouragement && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200 text-center">
              <p className="text-green-800 font-medium text-lg">
                {analysis.encouragement}
              </p>
            </div>
          )}

          {/* Main Analysis */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
            <div className="prose prose-sm max-w-none text-gray-700">
              <p className="whitespace-pre-wrap leading-relaxed">
                {analysis.analysis}
              </p>
            </div>
          </div>

          {/* Progress Trends */}
          {analysis.progressTrends && analysis.progressTrends.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-800">Progress Trends</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.progressTrends.map((trend, index) => (
                  <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                    {trend}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scientific Insights Card */}
      {analysis.scientificInsights && (
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Microscope className="w-5 h-5" />
              Dr. Breathe's Scientific Insights: {patternName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible open={showScientificDetails} onOpenChange={setShowScientificDetails}>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="prose prose-sm max-w-none text-purple-800">
                  <p className="leading-relaxed">
                    {showScientificDetails 
                      ? analysis.scientificInsights
                      : `${analysis.scientificInsights.slice(0, 150)}...`
                    }
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-purple-600 hover:text-purple-800"
                  >
                    {showScientificDetails ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Learn More
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Pattern-Specific Guidance */}
      {analysis.patternSpecificGuidance && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Target className="w-5 h-5" />
              Dr. Breathe's Pattern Guidance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-orange-800 leading-relaxed">
                {analysis.patternSpecificGuidance}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Scores */}
      <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Award className="w-5 h-5" />
              Your Performance Assessment
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <Badge variant={getScoreBadgeVariant(analysis.score.overall)} className="text-lg px-3 py-1">
                {analysis.score.overall}/100
              </Badge>
              <p className="text-sm font-medium text-gray-600">Overall</p>
              <Progress 
                value={analysis.score.overall} 
                className="h-2"
                indicatorClassName={
                  analysis.score.overall >= 80 ? "bg-green-500" :
                  analysis.score.overall >= 60 ? "bg-yellow-500" : "bg-red-500"
                }
              />
            </div>
            <div className="text-center space-y-2">
              <Badge variant={getScoreBadgeVariant(analysis.score.focus)} className="text-lg px-3 py-1">
                {analysis.score.focus}/100
              </Badge>
              <p className="text-sm font-medium text-gray-600">Focus</p>
              <Progress 
                value={analysis.score.focus} 
                className="h-2"
                indicatorClassName={
                  analysis.score.focus >= 80 ? "bg-green-500" :
                  analysis.score.focus >= 60 ? "bg-yellow-500" : "bg-red-500"
                }
              />
            </div>
            <div className="text-center space-y-2">
              <Badge variant={getScoreBadgeVariant(analysis.score.consistency)} className="text-lg px-3 py-1">
                {analysis.score.consistency}/100
              </Badge>
              <p className="text-sm font-medium text-gray-600">Consistency</p>
              <Progress 
                value={analysis.score.consistency} 
                className="h-2"
                indicatorClassName={
                  analysis.score.consistency >= 80 ? "bg-green-500" :
                  analysis.score.consistency >= 60 ? "bg-yellow-500" : "bg-red-500"
                }
              />
            </div>
            <div className="text-center space-y-2">
              <Badge variant={getScoreBadgeVariant(analysis.score.progress)} className="text-lg px-3 py-1">
                {analysis.score.progress}/100
              </Badge>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <Progress 
                value={analysis.score.progress} 
                className="h-2"
                indicatorClassName={
                  analysis.score.progress >= 80 ? "bg-green-500" :
                  analysis.score.progress >= 60 ? "bg-yellow-500" : "bg-red-500"
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions and Next Steps */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Suggestions */}
        <Card className="border-teal-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Sparkles className="w-5 h-5" />
              Dr. Breathe's Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="w-6 h-6 bg-teal-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-teal-700">{index + 1}</span>
                  </div>
                  <p className="text-sm text-teal-800 leading-relaxed">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Activity className="w-5 h-5" />
              Your Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-emerald-700">{index + 1}</span>
                  </div>
                  <p className="text-sm text-emerald-800 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Follow-up Questions */}
      {analysis.followUpQuestions && analysis.followUpQuestions.length > 0 && (
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-700">
              <MessageCircle className="w-5 h-5" />
              Chat with Dr. Breathe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible open={showQuestions} onOpenChange={setShowQuestions}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full border-pink-200 text-pink-700 hover:bg-pink-50">
                  {showQuestions ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Hide Questions
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Answer Questions for Deeper Insights ({analysis.followUpQuestions.length})
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-3">
                  {analysis.followUpQuestions.map((question, index) => (
                    <div key={index} className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                      <p className="text-pink-800 font-medium mb-2">
                        Q{index + 1}: {question}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-pink-300 text-pink-700 hover:bg-pink-100"
                      >
                        Answer This Question
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                    <p className="text-sm text-pink-700">
                      🩺 <strong>Dr. Breathe is ready to chat!</strong> Ask questions about your practice and get personalized coaching advice.
                    </p>
                  </div>
                  
                  {/* Interactive Chat Interface */}
                  <div className="space-y-3">
                    {/* Chat Messages */}
                    {chatMessages.length > 0 && (
                      <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg border border-pink-200">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-2 ${
                              msg.role === 'user' 
                                ? 'bg-pink-500 text-white' 
                                : 'bg-white border border-pink-200 text-gray-800'
                            }`}>
                              <div className="flex items-center gap-1 mb-1">
                                {msg.role === 'user' ? (
                                  <User className="w-3 h-3" />
                                ) : (
                                  <Stethoscope className="w-3 h-3 text-pink-600" />
                                )}
                                <span className="text-xs font-medium">
                                  {msg.role === 'user' ? 'You' : 'Dr. Breathe'}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-pink-200 rounded-lg p-2">
                              <div className="flex items-center gap-1">
                                <Stethoscope className="w-3 h-3 text-pink-600" />
                                <span className="text-xs font-medium">Dr. Breathe</span>
                                <Loader2 className="w-3 h-3 animate-spin" />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Thinking...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Chat Input */}
                    <div className="flex gap-2">
                      <input 
                        ref={chatInputRef}
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Ask Dr. Breathe about your breathing practice..."
                        className="flex-1 px-3 py-2 text-sm border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
                        disabled={isChatLoading}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="px-3 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {isChatLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-pink-600">
                        💡 Try asking: "How can I improve my stillness?" or "What does my score mean?"
                      </p>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
