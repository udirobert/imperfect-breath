import React, { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Plus,
  GripVertical,
  Trash2,
  Play,
  Pause,
  Volume2,
  Video,
  Image,
  Link,
  Sparkles,
  Timer,
  Heart,
  Brain,
  Zap,
  Moon,
  Target,
  Award,
  DollarSign,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Separator } from "../ui/separator";
import { BreathingPhase } from "../../lib/breathingPatterns";
import {
  EnhancedCustomPattern,
  MediaContent,
  LicenseSettings,
  BenefitClaim,
  defaultBenefit,
  defaultLicense,
} from "../../types/patterns";

interface EnhancedPatternBuilderProps {
  onSave: (pattern: EnhancedCustomPattern) => void;
  existingPattern?: EnhancedCustomPattern;
}

const categoryIcons = {
  stress: Heart,
  sleep: Moon,
  focus: Target,
  energy: Zap,
  performance: Award,
};

const EnhancedPatternBuilder: React.FC<EnhancedPatternBuilderProps> = ({
  onSave,
  existingPattern,
}) => {
  const [pattern, setPattern] = useState<EnhancedCustomPattern>({
    id: existingPattern?.id || Date.now().toString(),
    name: existingPattern?.name || "",
    description: existingPattern?.description || "",
    phases: existingPattern?.phases || [],
    category: existingPattern?.category || "stress",
    difficulty: existingPattern?.difficulty || "beginner",
    duration: existingPattern?.duration || 0,
    creator: existingPattern?.creator || "instructor-placeholder",

    // Enhanced fields
    tags: existingPattern?.tags || [],
    targetAudience: existingPattern?.targetAudience || [],
    expectedDuration: existingPattern?.expectedDuration || 5,
    sessionCount: existingPattern?.sessionCount || 7,

    primaryBenefits: existingPattern?.primaryBenefits || [],
    secondaryBenefits: existingPattern?.secondaryBenefits || [],

    instructorName: existingPattern?.instructorName || "",
    instructorBio: existingPattern?.instructorBio || "",
    instructorCredentials: existingPattern?.instructorCredentials || [],

    licenseSettings: existingPattern?.licenseSettings || defaultLicense,

    hasProgressTracking: existingPattern?.hasProgressTracking || true,
    hasAIFeedback: existingPattern?.hasAIFeedback || true,
    customInstructions: existingPattern?.customInstructions || "",
    preparationNotes: existingPattern?.preparationNotes || "",
    postSessionNotes: existingPattern?.postSessionNotes || "",
  });

  const [currentTab, setCurrentTab] = useState("basics");
  const [newTag, setNewTag] = useState("");
  const [newBenefit, setNewBenefit] = useState<BenefitClaim>(defaultBenefit);

  const calculateDuration = useCallback(() => {
    const totalDuration = pattern.phases.reduce(
      (sum, phase) => sum + (phase.duration || 0),
      0
    );
    setPattern((prev) => ({ ...prev, duration: totalDuration }));
  }, [pattern.phases]);

  useEffect(() => {
    calculateDuration();
  }, [calculateDuration]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newPhases = Array.from(pattern.phases);
    const [reorderedItem] = newPhases.splice(result.source.index, 1);
    newPhases.splice(result.destination.index, 0, reorderedItem);

    setPattern((prev) => ({ ...prev, phases: newPhases }));
  };

  const addPhase = (type: BreathingPhase["name"]) => {
    const phaseTexts = {
      inhale: "Breathe in deeply through your nose",
      exhale: "Breathe out slowly through your mouth",
      hold: "Hold your breath gently",
      pause: "Natural pause - breathe normally",
    };

    const newPhase: BreathingPhase = {
      name: type,
      duration: type === "hold" ? 7000 : type === "pause" ? 2000 : 4000,
      text: phaseTexts[type] || "Follow your breath",
    };

    setPattern((prev) => ({ ...prev, phases: [...prev.phases, newPhase] }));
  };

  const updatePhase = (
    index: number,
    field: keyof BreathingPhase,
    value: string | number
  ) => {
    const newPhases = [...pattern.phases];
    newPhases[index] = { ...newPhases[index], [field]: value };
    setPattern((prev) => ({ ...prev, phases: newPhases }));
  };

  const removePhase = (index: number) => {
    setPattern((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setPattern((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPattern((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addBenefit = () => {
    if (newBenefit.title.trim()) {
      setPattern((prev) => ({
        ...prev,
        primaryBenefits: [
          ...prev.primaryBenefits,
          { ...newBenefit, id: Date.now().toString() },
        ],
      }));
      setNewBenefit(defaultBenefit);
    }
  };

  const removeBenefit = (benefitId: string) => {
    setPattern((prev) => ({
      ...prev,
      primaryBenefits: prev.primaryBenefits.filter((b) => b.id !== benefitId),
    }));
  };

  const updateMediaContent = (
    type: keyof Pick<
      EnhancedCustomPattern,
      "instructionalVideo" | "guidedAudio" | "backgroundMusic" | "visualGuide"
    >,
    content: Partial<MediaContent>
  ) => {
    setPattern((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...content },
    }));
  };

  const handleSave = () => {
    onSave(pattern);
  };

  const CategoryIcon = categoryIcons[pattern.category];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <CategoryIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create Breathing Pattern</h1>
            <p className="text-muted-foreground">
              Design your unique breathing technique
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Timer className="h-3 w-3" />
            {Math.ceil(pattern.duration / 1000)}s cycle
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {pattern.phases.length} phases
          </Badge>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="licensing">Licensing</TabsTrigger>
        </TabsList>

        {/* Basics Tab */}
        <TabsContent value="basics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Pattern Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Pattern Name *</Label>
                    <Input
                      id="name"
                      value={pattern.name}
                      onChange={(e) =>
                        setPattern((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Ocean Wave Breathing"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={pattern.description}
                      onChange={(e) =>
                        setPattern((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the purpose and technique..."
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={pattern.category}
                        onValueChange={(value: any) =>
                          setPattern((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stress">
                            🫀 Stress Relief
                          </SelectItem>
                          <SelectItem value="sleep">🌙 Sleep & Rest</SelectItem>
                          <SelectItem value="focus">
                            🎯 Focus & Clarity
                          </SelectItem>
                          <SelectItem value="energy">
                            ⚡ Energy & Vitality
                          </SelectItem>
                          <SelectItem value="performance">
                            🏆 Performance
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Difficulty</Label>
                      <Select
                        value={pattern.difficulty}
                        onValueChange={(value: any) =>
                          setPattern((prev) => ({ ...prev, difficulty: value }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">🌱 Beginner</SelectItem>
                          <SelectItem value="intermediate">
                            🌿 Intermediate
                          </SelectItem>
                          <SelectItem value="advanced">🌳 Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Expected Session Duration (minutes)</Label>
                    <div className="mt-1">
                      <Slider
                        value={[pattern.expectedDuration]}
                        onValueChange={(value) =>
                          setPattern((prev) => ({
                            ...prev,
                            expectedDuration: value[0],
                          }))
                        }
                        max={60}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>1 min</span>
                        <span className="font-medium">
                          {pattern.expectedDuration} minutes
                        </span>
                        <span>60 min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Recommended Sessions/Week</Label>
                    <div className="mt-1">
                      <Slider
                        value={[pattern.sessionCount]}
                        onValueChange={(value) =>
                          setPattern((prev) => ({
                            ...prev,
                            sessionCount: value[0],
                          }))
                        }
                        max={21}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>1/week</span>
                        <span className="font-medium">
                          {pattern.sessionCount}/week
                        </span>
                        <span>21/week</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                      />
                      <Button onClick={addTag} variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pattern.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instructorName">Your Name</Label>
                  <Input
                    id="instructorName"
                    value={pattern.instructorName}
                    onChange={(e) =>
                      setPattern((prev) => ({
                        ...prev,
                        instructorName: e.target.value,
                      }))
                    }
                    placeholder="Your professional name"
                  />
                </div>
                <div>
                  <Label htmlFor="instructorAvatar">
                    Profile Image URL (optional)
                  </Label>
                  <Input
                    id="instructorAvatar"
                    value={pattern.instructorAvatar || ""}
                    onChange={(e) =>
                      setPattern((prev) => ({
                        ...prev,
                        instructorAvatar: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="instructorBio">Bio</Label>
                <Textarea
                  id="instructorBio"
                  value={pattern.instructorBio}
                  onChange={(e) =>
                    setPattern((prev) => ({
                      ...prev,
                      instructorBio: e.target.value,
                    }))
                  }
                  placeholder="Tell users about your background and expertise..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Breathing Phases</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPhase("inhale")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Inhale
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPhase("hold")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Hold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPhase("exhale")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Exhale
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addPhase("pause")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pattern.phases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No phases yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your breathing pattern by adding phases
                    above.
                  </p>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="phases">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {pattern.phases.map((phase, index) => (
                          <Draggable
                            key={index}
                            draggableId={`phase-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 border rounded-lg bg-card transition-all ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="capitalize font-medium"
                                    >
                                      {phase.name} {index + 1}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePhase(index)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Duration (seconds)
                                    </Label>
                                    <Input
                                      type="number"
                                      value={Math.round(
                                        (phase.duration || 0) / 1000
                                      )}
                                      onChange={(e) =>
                                        updatePhase(
                                          index,
                                          "duration",
                                          parseInt(e.target.value) * 1000
                                        )
                                      }
                                      min="1"
                                      max="60"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">
                                      Guidance Text
                                    </Label>
                                    <Input
                                      value={phase.text}
                                      onChange={(e) =>
                                        updatePhase(
                                          index,
                                          "text",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Instruction for this phase..."
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Media Content
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add audio and video content to enhance your breathing pattern
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instructional Video */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <Label className="font-medium">Instructional Video</Label>
                </div>
                <Input
                  value={pattern.instructionalVideo?.url || ""}
                  onChange={(e) =>
                    updateMediaContent("instructionalVideo", {
                      type: "video",
                      url: e.target.value,
                    })
                  }
                  placeholder="YouTube, Vimeo, or direct video URL..."
                />
                <p className="text-xs text-muted-foreground">
                  Add a video explaining your technique (YouTube/Vimeo links
                  work great)
                </p>
              </div>

              <Separator />

              {/* Guided Audio */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <Label className="font-medium">Guided Audio Session</Label>
                </div>
                <Input
                  value={pattern.guidedAudio?.url || ""}
                  onChange={(e) =>
                    updateMediaContent("guidedAudio", {
                      type: "audio",
                      url: e.target.value,
                    })
                  }
                  placeholder="Audio file URL or SoundCloud link..."
                />
                <p className="text-xs text-muted-foreground">
                  Your voice guiding users through the breathing pattern
                </p>
              </div>

              <Separator />

              {/* Background Music */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <Label className="font-medium">
                    Background Music (Optional)
                  </Label>
                </div>
                <Input
                  value={pattern.backgroundMusic?.url || ""}
                  onChange={(e) =>
                    updateMediaContent("backgroundMusic", {
                      type: "audio",
                      url: e.target.value,
                    })
                  }
                  placeholder="Relaxing background music URL..."
                />
                <p className="text-xs text-muted-foreground">
                  Optional ambient music to enhance the experience
                </p>
              </div>

              <Separator />

              {/* Visual Guide */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <Label className="font-medium">Visual Guide (Optional)</Label>
                </div>
                <Input
                  value={pattern.visualGuide?.url || ""}
                  onChange={(e) =>
                    updateMediaContent("visualGuide", {
                      type: "image",
                      url: e.target.value,
                    })
                  }
                  placeholder="Diagram or image URL..."
                />
                <p className="text-xs text-muted-foreground">
                  A visual diagram showing the breathing pattern
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Benefits & Claims
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Benefit Title</Label>
                    <Input
                      value={newBenefit.title}
                      onChange={(e) =>
                        setNewBenefit((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g., Reduces stress levels"
                    />
                  </div>
                  <div>
                    <Label>Evidence Level</Label>
                    <Select
                      value={newBenefit.evidenceLevel}
                      onValueChange={(value: any) =>
                        setNewBenefit((prev) => ({
                          ...prev,
                          evidenceLevel: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scientific">
                          🔬 Scientific Studies
                        </SelectItem>
                        <SelectItem value="anecdotal">
                          💭 Personal Experience
                        </SelectItem>
                        <SelectItem value="traditional">
                          📚 Traditional Practice
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newBenefit.description}
                    onChange={(e) =>
                      setNewBenefit((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe how this benefit is achieved..."
                    className="min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={addBenefit}
                  className="w-full"
                  disabled={!newBenefit.title.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              </div>

              {pattern.primaryBenefits.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Claimed Benefits
                  </Label>
                  {pattern.primaryBenefits.map((benefit) => (
                    <div key={benefit.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{benefit.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {benefit.evidenceLevel}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {benefit.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBenefit(benefit.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Licensing Tab */}
        <TabsContent value="licensing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Licensing & Monetization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Commercial Licensing
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to license your pattern
                    </p>
                  </div>
                  <Switch
                    checked={pattern.licenseSettings.isCommercial}
                    onCheckedChange={(checked) =>
                      setPattern((prev) => ({
                        ...prev,
                        licenseSettings: {
                          ...prev.licenseSettings,
                          isCommercial: checked,
                        },
                      }))
                    }
                  />
                </div>

                {pattern.licenseSettings.isCommercial && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>License Price</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            type="number"
                            step="0.001"
                            value={pattern.licenseSettings.price}
                            onChange={(e) =>
                              setPattern((prev) => ({
                                ...prev,
                                licenseSettings: {
                                  ...prev.licenseSettings,
                                  price: parseFloat(e.target.value) || 0,
                                },
                              }))
                            }
                            placeholder="0.01"
                          />
                          <Select
                            value={pattern.licenseSettings.currency}
                            onValueChange={(value: "ETH" | "USDC") =>
                              setPattern((prev) => ({
                                ...prev,
                                licenseSettings: {
                                  ...prev.licenseSettings,
                                  currency: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ETH">ETH</SelectItem>
                              <SelectItem value="USDC">USDC</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Royalty Percentage</Label>
                        <div className="mt-1">
                          <Slider
                            value={[pattern.licenseSettings.royaltyPercentage]}
                            onValueChange={(value) =>
                              setPattern((prev) => ({
                                ...prev,
                                licenseSettings: {
                                  ...prev.licenseSettings,
                                  royaltyPercentage: value[0],
                                },
                              }))
                            }
                            max={25}
                            min={0}
                            step={1}
                          />
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>0%</span>
                            <span className="font-medium">
                              {pattern.licenseSettings.royaltyPercentage}%
                            </span>
                            <span>25%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        License Terms
                      </Label>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Allow Derivatives</Label>
                            <p className="text-sm text-muted-foreground">
                              Others can modify your pattern
                            </p>
                          </div>
                          <Switch
                            checked={pattern.licenseSettings.allowDerivatives}
                            onCheckedChange={(checked) =>
                              setPattern((prev) => ({
                                ...prev,
                                licenseSettings: {
                                  ...prev.licenseSettings,
                                  allowDerivatives: checked,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Require Attribution</Label>
                            <p className="text-sm text-muted-foreground">
                              Credit you as the original creator
                            </p>
                          </div>
                          <Switch
                            checked={pattern.licenseSettings.attribution}
                            onCheckedChange={(checked) =>
                              setPattern((prev) => ({
                                ...prev,
                                licenseSettings: {
                                  ...prev.licenseSettings,
                                  attribution: checked,
                                },
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Commercial Use by Licensees</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow commercial use of your pattern
                            </p>
                          </div>
                          <Switch
                            checked={pattern.licenseSettings.commercialUse}
                            onCheckedChange={(checked) =>
                              setPattern((prev) => ({
                                ...prev,
                                licenseSettings: {
                                  ...prev.licenseSettings,
                                  commercialUse: checked,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!pattern.name || pattern.phases.length === 0}
          className="min-w-32"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Save Pattern
        </Button>
      </div>
    </div>
  );
};

export default EnhancedPatternBuilder;
