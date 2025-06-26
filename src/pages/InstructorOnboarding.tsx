import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Circle,
  Sparkles,
  Video,
  DollarSign,
  Users,
  Award,
  Heart,
  Brain,
  Target,
  Zap,
  Moon,
  Upload,
  Link,
  Play,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface InstructorProfile {
  // Personal Info
  name: string;
  email: string;
  profileImage?: string;
  bio: string;
  location: string;
  website?: string;

  // Professional Info
  credentials: string[];
  yearsExperience: number;
  specializations: string[];
  certifications: string[];

  // Content Preferences
  contentTypes: string[];
  targetAudience: string[];
  primaryCategories: string[];

  // Media Setup
  hasRecordingSetup: boolean;
  recordingQuality: "basic" | "professional" | "studio";
  contentDeliveryStyle: "guided" | "instructional" | "both";

  // Monetization
  interestedInMonetization: boolean;
  expectedEarnings: string;
  pricingModel: "free" | "paid" | "freemium";
}

const steps = [
  { id: 1, title: "Welcome", subtitle: "Tell us about yourself" },
  { id: 2, title: "Experience", subtitle: "Your breathing expertise" },
  { id: 3, title: "Content", subtitle: "What you'll create" },
  { id: 4, title: "Setup", subtitle: "Media and recording" },
  { id: 5, title: "Monetization", subtitle: "Earning preferences" },
  { id: 6, title: "Ready", subtitle: "Let's get started!" },
];

const specializations = [
  {
    id: "stress-relief",
    label: "Stress Relief",
    icon: Heart,
    color: "bg-red-100 text-red-600",
  },
  {
    id: "sleep",
    label: "Sleep & Relaxation",
    icon: Moon,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "focus",
    label: "Focus & Clarity",
    icon: Target,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "energy",
    label: "Energy & Vitality",
    icon: Zap,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    id: "performance",
    label: "Athletic Performance",
    icon: Award,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "mindfulness",
    label: "Mindfulness",
    icon: Brain,
    color: "bg-indigo-100 text-indigo-600",
  },
];

const InstructorOnboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<InstructorProfile>({
    name: "",
    email: "",
    bio: "",
    location: "",
    credentials: [],
    yearsExperience: 0,
    specializations: [],
    certifications: [],
    contentTypes: [],
    targetAudience: [],
    primaryCategories: [],
    hasRecordingSetup: false,
    recordingQuality: "basic",
    contentDeliveryStyle: "both",
    interestedInMonetization: true,
    expectedEarnings: "",
    pricingModel: "freemium",
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      // In production, this would save to blockchain/backend
      console.log("Saving instructor profile:", profile);

      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: "Welcome to the Platform!",
        description: "Your instructor profile has been created successfully.",
      });

      // Navigate to creator dashboard
      navigate("/creator");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleArrayItem = <T,>(
    array: T[],
    item: T,
    setter: (items: T[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-6 rounded-full bg-primary/10 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Welcome to the Creator Platform!
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of breathing instructors sharing their expertise
                and earning from their unique techniques.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="p-4 rounded-full bg-green-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Share Your Expertise</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and share your unique breathing patterns with a
                    global audience
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="p-4 rounded-full bg-blue-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Monetize Your Skills</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn from your breathing techniques through our
                    blockchain-based IP system
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="p-4 rounded-full bg-purple-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Build Your Brand</h3>
                  <p className="text-sm text-muted-foreground">
                    Establish yourself as a thought leader in the breathwork
                    community
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Let's get to know you</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Your professional name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Tell us about yourself</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Share your background, experience, and what motivates you to teach breathing techniques..."
                    className="min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Your Breathing Expertise
              </h2>
              <p className="text-lg text-muted-foreground">
                Help us understand your background and specializations
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Experience Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Years of Experience</Label>
                  <Select
                    value={profile.yearsExperience.toString()}
                    onValueChange={(value) =>
                      setProfile((prev) => ({
                        ...prev,
                        yearsExperience: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Less than 1 year</SelectItem>
                      <SelectItem value="1">1-2 years</SelectItem>
                      <SelectItem value="3">3-5 years</SelectItem>
                      <SelectItem value="6">6-10 years</SelectItem>
                      <SelectItem value="11">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Professional Credentials (optional)</Label>
                  <Textarea
                    value={profile.credentials.join("\n")}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        credentials: e.target.value.split("\n").filter(Boolean),
                      }))
                    }
                    placeholder="Yoga Teacher Training (200hr)&#10;Certified Breathwork Facilitator&#10;Meditation Instructor Certification"
                    className="mt-1 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter each credential on a new line
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specializations</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select all areas you specialize in
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specializations.map((spec) => {
                    const Icon = spec.icon;
                    const isSelected = profile.specializations.includes(
                      spec.id
                    );

                    return (
                      <div
                        key={spec.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/50"
                        }`}
                        onClick={() =>
                          toggleArrayItem(
                            profile.specializations,
                            spec.id,
                            (items) =>
                              setProfile((prev) => ({
                                ...prev,
                                specializations: items,
                              }))
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${spec.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{spec.label}</span>
                              {isSelected ? (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Content You'll Create</h2>
              <p className="text-lg text-muted-foreground">
                What type of content do you want to share?
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Content Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    id: "patterns",
                    label: "Breathing Patterns",
                    desc: "Custom breathing sequences and techniques",
                  },
                  {
                    id: "guided-sessions",
                    label: "Guided Audio Sessions",
                    desc: "Voice-guided breathing sessions",
                  },
                  {
                    id: "video-tutorials",
                    label: "Video Tutorials",
                    desc: "Educational videos explaining techniques",
                  },
                  {
                    id: "written-guides",
                    label: "Written Guides",
                    desc: "Text-based instructions and explanations",
                  },
                  {
                    id: "courses",
                    label: "Multi-Session Courses",
                    desc: "Structured learning programs",
                  },
                ].map((type) => (
                  <div key={type.id} className="flex items-start gap-3">
                    <Checkbox
                      id={type.id}
                      checked={profile.contentTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProfile((prev) => ({
                            ...prev,
                            contentTypes: [...prev.contentTypes, type.id],
                          }));
                        } else {
                          setProfile((prev) => ({
                            ...prev,
                            contentTypes: prev.contentTypes.filter(
                              (t) => t !== type.id
                            ),
                          }));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={type.id}
                        className="font-medium cursor-pointer"
                      >
                        {type.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {type.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    id: "beginners",
                    label: "Beginners",
                    desc: "New to breathing practices",
                  },
                  {
                    id: "intermediate",
                    label: "Intermediate",
                    desc: "Some breathing experience",
                  },
                  {
                    id: "advanced",
                    label: "Advanced Practitioners",
                    desc: "Experienced in breathwork",
                  },
                  {
                    id: "athletes",
                    label: "Athletes & Performers",
                    desc: "Performance optimization",
                  },
                  {
                    id: "wellness",
                    label: "Wellness Seekers",
                    desc: "Health and wellbeing focus",
                  },
                  {
                    id: "corporate",
                    label: "Corporate Professionals",
                    desc: "Workplace stress management",
                  },
                ].map((audience) => (
                  <div key={audience.id} className="flex items-start gap-3">
                    <Checkbox
                      id={audience.id}
                      checked={profile.targetAudience.includes(audience.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setProfile((prev) => ({
                            ...prev,
                            targetAudience: [
                              ...prev.targetAudience,
                              audience.id,
                            ],
                          }));
                        } else {
                          setProfile((prev) => ({
                            ...prev,
                            targetAudience: prev.targetAudience.filter(
                              (a) => a !== audience.id
                            ),
                          }));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={audience.id}
                        className="font-medium cursor-pointer"
                      >
                        {audience.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {audience.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Media & Recording Setup
              </h2>
              <p className="text-lg text-muted-foreground">
                Tell us about your content creation capabilities
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recording Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium">
                    Do you have recording equipment?
                  </Label>
                  <RadioGroup
                    value={profile.hasRecordingSetup.toString()}
                    onValueChange={(value) =>
                      setProfile((prev) => ({
                        ...prev,
                        hasRecordingSetup: value === "true",
                      }))
                    }
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="has-setup" />
                      <Label htmlFor="has-setup">
                        Yes, I have recording equipment
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="no-setup" />
                      <Label htmlFor="no-setup">
                        No, I'll use basic equipment or phone
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Recording Quality
                  </Label>
                  <RadioGroup
                    value={profile.recordingQuality}
                    onValueChange={(value: any) =>
                      setProfile((prev) => ({
                        ...prev,
                        recordingQuality: value,
                      }))
                    }
                    className="mt-2"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem
                          value="basic"
                          id="basic"
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="basic" className="font-medium">
                            Basic (Phone/Laptop)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Using built-in microphone and camera
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem
                          value="professional"
                          id="professional"
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="professional" className="font-medium">
                            Professional
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            External microphone, good lighting, HD camera
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem
                          value="studio"
                          id="studio"
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="studio" className="font-medium">
                            Studio Quality
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Professional studio setup with high-end equipment
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base font-medium">
                    Content Delivery Style
                  </Label>
                  <RadioGroup
                    value={profile.contentDeliveryStyle}
                    onValueChange={(value: any) =>
                      setProfile((prev) => ({
                        ...prev,
                        contentDeliveryStyle: value,
                      }))
                    }
                    className="mt-2"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem
                          value="guided"
                          id="guided"
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="guided" className="font-medium">
                            Guided Sessions
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Real-time voice guidance during breathing
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem
                          value="instructional"
                          id="instructional"
                          className="mt-1"
                        />
                        <div>
                          <Label
                            htmlFor="instructional"
                            className="font-medium"
                          >
                            Instructional Videos
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Teaching and explaining techniques
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem
                          value="both"
                          id="both"
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="both" className="font-medium">
                            Both
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Mix of guided sessions and instructional content
                          </p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Easy Media Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 border rounded-lg">
                      <Video className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                      <h3 className="font-semibold mb-2">Video Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Simply paste YouTube or Vimeo links - no uploading
                        required!
                      </p>
                    </div>
                    <div className="text-center p-6 border rounded-lg">
                      <Mic className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">Audio Content</h3>
                      <p className="text-sm text-muted-foreground">
                        Link to SoundCloud, Spotify, or any audio hosting
                        service
                      </p>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <strong>Pro Tip:</strong> You can use existing platforms
                      to host your content and simply share the links. No need
                      for complex video uploading or storage!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Monetization Preferences
              </h2>
              <p className="text-lg text-muted-foreground">
                How do you want to earn from your breathing expertise?
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Earning Interest</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">
                      Interested in monetizing your content?
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      You can always change this later
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={
                        profile.interestedInMonetization ? "default" : "outline"
                      }
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          interestedInMonetization: true,
                        }))
                      }
                    >
                      Yes
                    </Button>
                    <Button
                      variant={
                        !profile.interestedInMonetization
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setProfile((prev) => ({
                          ...prev,
                          interestedInMonetization: false,
                        }))
                      }
                    >
                      Not yet
                    </Button>
                  </div>
                </div>

                {profile.interestedInMonetization && (
                  <>
                    <Separator />

                    <div>
                      <Label className="text-base font-medium">
                        Pricing Model
                      </Label>
                      <RadioGroup
                        value={profile.pricingModel}
                        onValueChange={(value: any) =>
                          setProfile((prev) => ({
                            ...prev,
                            pricingModel: value,
                          }))
                        }
                        className="mt-2"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem
                              value="free"
                              id="free"
                              className="mt-1"
                            />
                            <div>
                              <Label htmlFor="free" className="font-medium">
                                Free Content
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Build audience first, monetize later
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem
                              value="freemium"
                              id="freemium"
                              className="mt-1"
                            />
                            <div>
                              <Label htmlFor="freemium" className="font-medium">
                                Freemium
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Some free content, premium paid content
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <RadioGroupItem
                              value="paid"
                              id="paid"
                              className="mt-1"
                            />
                            <div>
                              <Label htmlFor="paid" className="font-medium">
                                Premium Only
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                All content requires licensing fees
                              </p>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="expected-earnings">
                        Expected Monthly Earnings Goal
                      </Label>
                      <Select
                        value={profile.expectedEarnings}
                        onValueChange={(value) =>
                          setProfile((prev) => ({
                            ...prev,
                            expectedEarnings: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-100">$0 - $100</SelectItem>
                          <SelectItem value="100-500">$100 - $500</SelectItem>
                          <SelectItem value="500-1000">
                            $500 - $1,000
                          </SelectItem>
                          <SelectItem value="1000-5000">
                            $1,000 - $5,000
                          </SelectItem>
                          <SelectItem value="5000+">$5,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {profile.interestedInMonetization && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    How You'll Earn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="p-3 rounded-full bg-green-100 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Direct Licensing</h3>
                      <p className="text-sm text-muted-foreground">
                        Users pay to license your breathing patterns
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className="p-3 rounded-full bg-blue-100 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <Award className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold mb-2">Royalties</h3>
                      <p className="text-sm text-muted-foreground">
                        Earn ongoing royalties from pattern usage
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className="p-3 rounded-full bg-purple-100 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold mb-2">IP Protection</h3>
                      <p className="text-sm text-muted-foreground">
                        Your patterns are protected as blockchain IP assets
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="p-6 rounded-full bg-green-100 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Welcome to the breathing instructor community. Let's create your
                first pattern!
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Info</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Name:</strong> {profile.name}
                      </p>
                      <p>
                        <strong>Location:</strong> {profile.location}
                      </p>
                      <p>
                        <strong>Experience:</strong> {profile.yearsExperience}+
                        years
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.specializations.map((spec) => {
                        const specialization = specializations.find(
                          (s) => s.id === spec
                        );
                        return (
                          <Badge
                            key={spec}
                            variant="secondary"
                            className="text-xs"
                          >
                            {specialization?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Content Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.contentTypes.slice(0, 3).map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type.replace("-", " ")}
                        </Badge>
                      ))}
                      {profile.contentTypes.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{profile.contentTypes.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Monetization</h4>
                    <p className="text-sm">
                      {profile.interestedInMonetization ? (
                        <>
                          <Badge className="text-xs mr-2">
                            {profile.pricingModel}
                          </Badge>
                          {profile.expectedEarnings &&
                            `Goal: $${profile.expectedEarnings}/month`}
                        </>
                      ) : (
                        "Not monetizing yet"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <span>Create your first breathing pattern</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-blue-100">
                      <Video className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Add instructional media content</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-green-100">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Register your IP on the blockchain</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-purple-100">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Share with the community</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profile.name.trim() && profile.email.trim();
      case 2:
        return profile.specializations.length > 0;
      case 3:
        return (
          profile.contentTypes.length > 0 && profile.targetAudience.length > 0
        );
      case 4:
        return true; // All fields are optional
      case 5:
        return true; // All fields are optional
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Instructor Onboarding</h1>
              <p className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}:{" "}
                {steps[currentStep - 1]?.title}
              </p>
            </div>
            <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">{renderStep()}</div>
      </div>

      {/* Navigation */}
      <div className="border-t bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep === steps.length ? (
              <Button onClick={handleFinish} className="min-w-32">
                <Sparkles className="h-4 w-4 mr-2" />
                Get Started!
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="min-w-32"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorOnboarding;
