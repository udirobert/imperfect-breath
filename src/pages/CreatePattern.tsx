import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import EnhancedPatternBuilder from "@/components/creator/EnhancedPatternBuilder";
import type { EnhancedCustomPattern } from "@/types/patterns";
import { PatternStorageService } from "@/lib/patternStorage";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";

const patternStorageService = new PatternStorageService();

const CreatePattern = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const editPattern = location.state?.editPattern as
    | EnhancedCustomPattern
    | undefined;
  const isEditing = !!editPattern;

  const handleSave = async (pattern: EnhancedCustomPattern) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save a pattern.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const patternToSave = {
        ...pattern,
        id: isEditing ? pattern.id : uuidv4(),
        creator: user.id,
      };

      const savedPatternId = await patternStorageService.savePattern(
        patternToSave
      );

      // For now, we'll skip the Story Protocol integration to focus on core functionality

      toast({
        title: isEditing ? "Pattern Updated" : "Pattern Created",
        description: `"${patternToSave.name}" has been saved successfully.`,
      });

      navigate("/creator-dashboard");
    } catch (error) {
      console.error("Failed to save pattern:", error);
      toast({
        title: "Error",
        description: "Failed to save the pattern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = (pattern: EnhancedCustomPattern) => {
    // Navigate to breathing session with preview pattern
    navigate("/session", {
      state: {
        previewPattern: pattern,
        isPreview: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/creator")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? "Edit Pattern" : "Create New Pattern"}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing
                    ? `Editing "${editPattern.name}"`
                    : "Design a custom breathing pattern"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const currentPattern = editPattern || {
                    id: Date.now().toString(),
                    name: "Preview Pattern",
                    description: "Pattern preview",
                    phases: [],
                    category: "stress" as const,
                    difficulty: "beginner" as const,
                    duration: 0,
                    creator: "preview",
                    tags: [],
                    targetAudience: [],
                    expectedDuration: 5,
                    sessionCount: 1,
                    primaryBenefits: [],
                    secondaryBenefits: [],
                    instructorName: "Preview",
                    instructorBio: "",
                    instructorCredentials: [],
                    licenseSettings: {
                      isCommercial: false,
                      price: 0,
                      currency: "ETH" as const,
                      allowDerivatives: false,
                      attribution: true,
                      commercialUse: false,
                      royaltyPercentage: 0,
                    },
                    hasProgressTracking: false,
                    hasAIFeedback: false,
                    customInstructions: "",
                    preparationNotes: "",
                    postSessionNotes: "",
                  };
                  handlePreview(currentPattern);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <EnhancedPatternBuilder
          onSave={handleSave}
          existingPattern={editPattern}
        />
      </div>

      {/* Tips Section */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>💡 Pattern Creation Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">
                    Effective Breathing Patterns
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Start with simple ratios like 4:4:4 or 4:7:8</li>
                    <li>• Include pauses to allow natural breathing</li>
                    <li>• Test your pattern before publishing</li>
                    <li>• Consider your target audience's experience level</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Monetization</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Register IP to protect your unique patterns</li>
                    <li>• Set appropriate licensing terms</li>
                    <li>• Create clear, descriptive names</li>
                    <li>• Include detailed usage instructions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePattern;
