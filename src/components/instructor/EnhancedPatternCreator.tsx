/**
 * Enhanced Pattern Creator - Professional Pattern Creation Tools
 * 
 * ENHANCEMENT FIRST: Builds on existing PatternBuilder with instructor-focused features
 * CLEAN: Separates instructor tools from basic user features
 * MODULAR: Reusable components for different instructor workflows
 */

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Wand2, 
  Play, 
  Save, 
  Share2, 
  DollarSign,
  Users,
  Target,
  Clock,
  Heart,
  Brain,
  Zap,
  Moon,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { BREATHING_PATTERNS } from "../../lib/breathingPatterns";

interface PatternPhase {
  name: string;
  duration: number;
  instruction: string;
  color: string;
}

interface InstructorPattern {
  id: string;
  name: string;
  description: string;
  phases: PatternPhase[];
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  benefits: string[];
  scientificBasis: string;
  targetAudience: string[];
  sessionLength: number;
  pricing: {
    free: boolean;
    price?: number;
    currency: string;
  };
  metadata: {
    createdBy: string;
    version: string;
    tags: string[];
  };
}

interface EnhancedPatternCreatorProps {
  onPatternSave?: (pattern: InstructorPattern) => void;
  onPatternTest?: (pattern: InstructorPattern) => void;
  existingPattern?: Partial<InstructorPattern>;
  mode?: "create" | "edit" | "template";
}

export const EnhancedPatternCreator: React.FC<EnhancedPatternCreatorProps> = ({
  onPatternSave,
  onPatternTest,
  existingPattern,
  mode = "create"
}) => {
  const [pattern, setPattern] = useState<InstructorPattern>({
    id: existingPattern?.id || `pattern_${Date.now()}`,
    name: existingPattern?.name || "",
    description: existingPattern?.description || "",
    phases: existingPattern?.phases || [
      { name: "Inhale", duration: 4, instruction: "Breathe in slowly through your nose", color: "bg-blue-100" },
      { name: "Hold", duration: 4, instruction: "Hold your breath gently", color: "bg-yellow-100" },
      { name: "Exhale", duration: 4, instruction: "Breathe out slowly through your mouth", color: "bg-green-100" },
      { name: "Pause", duration: 4, instruction: "Rest before the next cycle", color: "bg-purple-100" }
    ],
    difficulty: existingPattern?.difficulty || "beginner",
    category: existingPattern?.category || "stress-relief",
    benefits: existingPattern?.benefits || [],
    scientificBasis: existingPattern?.scientificBasis || "",
    targetAudience: existingPattern?.targetAudience || [],
    sessionLength: existingPattern?.sessionLength || 5,
    pricing: existingPattern?.pricing || { free: true, currency: "USD" },
    metadata: existingPattern?.metadata || {
      createdBy: "instructor",
      version: "1.0",
      tags: []
    }
  });

  const [activeTab, setActiveTab] = useState("basics");
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // CLEAN: Validation logic separated from UI
  const validatePattern = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!pattern.name.trim()) errors.push("Pattern name is required");
    if (!pattern.description.trim()) errors.push("Description is required");
    if (pattern.phases.some(p => p.duration <= 0)) errors.push("All phase durations must be positive");
    if (pattern.benefits.length === 0) errors.push("At least one benefit is required");
    if (!pattern.scientificBasis.trim()) errors.push("Scientific basis is required for credibility");
    if (pattern.targetAudience.length === 0) errors.push("Target audience is required");
    
    return errors;
  }, [pattern]);

  const handlePhaseUpdate = (index: number, field: keyof PatternPhase, value: any) => {
    setPattern(prev => ({
      ...prev,
      phases: prev.phases.map((phase, i) => 
        i === index ? { ...phase, [field]: value } : phase
      )
    }));
  };

  const handleBenefitAdd = (benefit: string) => {
    if (benefit.trim() && !pattern.benefits.includes(benefit.trim())) {
      setPattern(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefit.trim()]
      }));
    }
  };

  const handleBenefitRemove = (benefit: string) => {
    setPattern(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b !== benefit)
    }));
  };

  const handleAudienceAdd = (audience: string) => {
    if (audience.trim() && !pattern.targetAudience.includes(audience.trim())) {
      setPattern(prev => ({
        ...prev,
        targetAudience: [...prev.targetAudience, audience.trim()]
      }));
    }
  };

  const handleSave = async () => {
    setIsValidating(true);
    const errors = validatePattern();
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      onPatternSave?.(pattern);
    }
    
    setIsValidating(false);
  };

  const handleTest = () => {
    const errors = validatePattern();
    if (errors.length === 0) {
      onPatternTest?.(pattern);
    } else {
      setValidationErrors(errors);
    }
  };

  const totalCycleDuration = pattern.phases.reduce((sum, phase) => sum + phase.duration, 0);
  const estimatedCycles = Math.floor((pattern.sessionLength * 60) / totalCycleDuration);

  const categoryOptions = [
    { id: "stress-relief", label: "Stress Relief", icon: Heart, color: "text-red-600" },
    { id: "energy-boost", label: "Energy Boost", icon: Zap, color: "text-yellow-600" },
    { id: "sleep-aid", label: "Sleep Aid", icon: Moon, color: "text-blue-600" },
    { id: "focus-enhancement", label: "Focus Enhancement", icon: Target, color: "text-purple-600" },
    { id: "anxiety-relief", label: "Anxiety Relief", icon: Brain, color: "text-green-600" }
  ];

  const audienceOptions = [
    "Beginners", "Experienced practitioners", "Stress management", "Athletes", 
    "Students", "Healthcare workers", "Parents", "Seniors", "Teenagers"
  ];

  const benefitSuggestions = [
    "Reduces stress and anxiety", "Improves focus and concentration", "Enhances sleep quality",
    "Boosts energy levels", "Calms the nervous system", "Increases mindfulness",
    "Supports emotional regulation", "Improves respiratory function"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          {mode === "create" ? "Create New Pattern" : mode === "edit" ? "Edit Pattern" : "Pattern Template"}
        </h1>
        <p className="text-muted-foreground">
          Design professional breathing patterns for your students and courses
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Please fix these issues:</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Pattern Name</label>
                <Input
                  value={pattern.name}
                  onChange={(e) => setPattern(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Calming Ocean Breath"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={pattern.description}
                  onChange={(e) => setPattern(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what makes this pattern unique and effective..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty Level</label>
                  <select
                    value={pattern.difficulty}
                    onChange={(e) => setPattern(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Session Length (minutes)</label>
                  <Input
                    type="number"
                    value={pattern.sessionLength}
                    onChange={(e) => setPattern(prev => ({ ...prev, sessionLength: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categoryOptions.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-all ${
                          pattern.category === category.id 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setPattern(prev => ({ ...prev, category: category.id }))}
                      >
                        <CardContent className="p-3 text-center">
                          <Icon className={`h-6 w-6 mx-auto mb-2 ${category.color}`} />
                          <p className="text-sm font-medium">{category.label}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Breathing Phases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pattern.phases.map((phase, index) => (
                <Card key={index} className={`${phase.color} border-2`}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Phase Name</label>
                        <Input
                          value={phase.name}
                          onChange={(e) => handlePhaseUpdate(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                        <Input
                          type="number"
                          value={phase.duration}
                          onChange={(e) => handlePhaseUpdate(index, 'duration', parseInt(e.target.value) || 0)}
                          min="1"
                          max="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Instruction</label>
                        <Input
                          value={phase.instruction}
                          onChange={(e) => handlePhaseUpdate(index, 'instruction', e.target.value)}
                          placeholder="Guide your students..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Pattern Analysis</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Cycle Duration:</span>
                    <div>{totalCycleDuration}s</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Estimated Cycles:</span>
                    <div>{estimatedCycles}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Rhythm:</span>
                    <div>{pattern.phases.map(p => p.duration).join('-')}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Intensity:</span>
                    <div>{totalCycleDuration > 16 ? 'Slow' : totalCycleDuration > 12 ? 'Medium' : 'Fast'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Benefits & Scientific Basis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Scientific Basis</label>
                <Textarea
                  value={pattern.scientificBasis}
                  onChange={(e) => setPattern(prev => ({ ...prev, scientificBasis: e.target.value }))}
                  placeholder="Explain the research or physiological principles behind this pattern..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Benefits</label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {pattern.benefits.map((benefit, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => handleBenefitRemove(benefit)}
                      >
                        {benefit} ×
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {benefitSuggestions
                      .filter(suggestion => !pattern.benefits.includes(suggestion))
                      .map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleBenefitAdd(suggestion)}
                          className="justify-start text-left h-auto py-2"
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          {suggestion}
                        </Button>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {pattern.targetAudience.map((audience, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => setPattern(prev => ({
                      ...prev,
                      targetAudience: prev.targetAudience.filter(a => a !== audience)
                    }))}
                  >
                    {audience} ×
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {audienceOptions
                  .filter(option => !pattern.targetAudience.includes(option))
                  .map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAudienceAdd(option)}
                      className="justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {option}
                    </Button>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={pattern.pricing.free}
                    onChange={() => setPattern(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, free: true, price: undefined }
                    }))}
                  />
                  Free Pattern
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!pattern.pricing.free}
                    onChange={() => setPattern(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, free: false, price: 5 }
                    }))}
                  />
                  Premium Pattern
                </label>
              </div>

              {!pattern.pricing.free && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <Input
                      type="number"
                      value={pattern.pricing.price || 0}
                      onChange={(e) => setPattern(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, price: parseFloat(e.target.value) || 0 }
                      }))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={pattern.pricing.currency}
                      onChange={(e) => setPattern(prev => ({
                        ...prev,
                        pricing: { ...prev.pricing, currency: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Monetization Tips</h4>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Free patterns build your audience and credibility</li>
                  <li>• Premium patterns should offer unique value or advanced techniques</li>
                  <li>• Consider offering pattern bundles for better value</li>
                  <li>• Include detailed instructions and scientific explanations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button onClick={handleTest} variant="outline" size="lg">
          <Play className="h-4 w-4 mr-2" />
          Test Pattern
        </Button>
        <Button onClick={handleSave} disabled={isValidating} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isValidating ? "Validating..." : "Save Pattern"}
        </Button>
        <Button variant="outline" size="lg">
          <Share2 className="h-4 w-4 mr-2" />
          Share Preview
        </Button>
      </div>
    </div>
  );
};

export default EnhancedPatternCreator;