import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Users,
  DollarSign,
  Award,
  Heart,
  Brain,
  Target,
  Zap,
  Moon,
  Sparkles,
  Video,
  Mic,
  BarChart3,
  Shield,
  TrendingUp,
  Star,
  CheckCircle,
} from "lucide-react";

const EnhancedIndex = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Heart,
      title: "Stress Relief",
      description:
        "Science-backed breathing patterns proven to reduce cortisol levels",
    },
    {
      icon: Brain,
      title: "Mental Clarity",
      description:
        "Improve focus and cognitive performance through targeted breathing",
    },
    {
      icon: Moon,
      title: "Better Sleep",
      description:
        "Fall asleep faster with calming nighttime breathing routines",
    },
    {
      icon: Zap,
      title: "Energy Boost",
      description:
        "Energizing patterns to naturally increase alertness and vitality",
    },
  ];

  const instructorBenefits = [
    {
      icon: DollarSign,
      title: "Monetize Your Expertise",
      description:
        "Earn from your unique breathing techniques through blockchain IP protection",
      highlight: "Early Platform - Growing",
    },
    {
      icon: Users,
      title: "Global Reach",
      description: "Share your techniques with users worldwide",
      highlight: "Growing Community",
    },
    {
      icon: Shield,
      title: "IP Protection",
      description:
        "Your patterns are protected as blockchain assets on Story Protocol",
      highlight: "Secure & Permanent",
    },
    {
      icon: Award,
      title: "Build Authority",
      description: "Establish yourself as a recognized breathing expert",
      highlight: "Expert Recognition",
    },
  ];

  const testimonials = [
    {
      name: "Platform Beta Tester",
      role: "Early Adopter",
      content:
        "The blockchain-based IP protection concept is innovative. Looking forward to seeing the platform grow.",
      rating: 4,
      isDemo: true,
    },
    {
      name: "Wellness Professional",
      role: "Industry Expert",
      content:
        "The multichain approach to wellness content is unique. Excited about the potential for creators.",
      rating: 4,
      isDemo: true,
    },
    {
      name: "Tech Enthusiast",
      role: "Web3 User",
      content:
        "Interesting use case for blockchain technology in the wellness space. Platform has potential.",
      rating: 4,
      isDemo: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-1">
            🚀 World's First Blockchain-Powered Breathing Platform
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-6">
            Breathe. Earn. Inspire.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The revolutionary platform where breathing instructors monetize
            their expertise and users discover life-changing techniques
          </p>
        </div>

        {/* Main CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* For Instructors */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all group hover:shadow-xl">
            <div className="absolute top-0 right-0 p-2">
              <Badge className="bg-green-600 hover:bg-green-600">
                💰 Earn Money
              </Badge>
            </div>
            <CardHeader className="pb-4">
              <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center">
                For Breathing Instructors
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Turn your expertise into a sustainable income stream
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">
                    Create & protect custom patterns
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Easy audio/video integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">Blockchain IP protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm">
                    Automated licensing & royalties
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => navigate("/instructor-onboarding")}
                  className="w-full group/btn"
                  size="lg"
                >
                  Start Teaching & Earning
                  <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  ⚡ Set up in 5 minutes • No upfront costs
                </p>
              </div>
            </CardContent>
          </Card>

          {/* For Users */}
          <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all group hover:shadow-xl">
            <div className="absolute top-0 right-0 p-2">
              <Badge variant="secondary">🧘‍♀️ Find Peace</Badge>
            </div>
            <CardHeader className="pb-4">
              <div className="p-4 rounded-full bg-blue-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-center">
                For Wellness Seekers
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Discover expert-crafted breathing techniques
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Expert-created patterns</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">AI-powered progress tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Guided audio sessions</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Personalized recommendations</span>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => navigate("/marketplace")}
                  variant="outline"
                  className="w-full group/btn border-blue-200 hover:border-blue-300"
                  size="lg"
                >
                  Explore Breathing Patterns
                  <Play className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  🆓 Free patterns available • Premium from $0.01
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Benefits for Users */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transform Your Wellbeing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the power of expert-guided breathing techniques backed by
              science and tradition
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="p-3 rounded-full bg-primary/10 w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructor Benefits */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Instructors Choose Our Platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join the revolution in breathing instruction with
              blockchain-powered IP protection and global reach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {instructorBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{benefit.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {benefit.highlight}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              See how instructors are transforming their careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  {testimonial.isDemo && (
                    <div className="mb-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Early Feedback
                      </Badge>
                    </div>
                  )}
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <blockquote className="text-sm mb-4 italic">
                    "{testimonial.content}"
                  </blockquote>
                  <div>
                    <div className="font-semibold text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                Beta
              </div>
              <div className="text-sm text-muted-foreground">
                Platform Stage
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                3
              </div>
              <div className="text-sm text-muted-foreground">Blockchains Integrated</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                Web3
              </div>
              <div className="text-sm text-muted-foreground">
                Native Platform
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                USDC
              </div>
              <div className="text-sm text-muted-foreground">
                Unified Currency
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Platform in active development - Join our growing community
            </Badge>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're looking to share your expertise or discover
            transformative breathing techniques, join our growing community
            today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/instructor-onboarding")}
              size="lg"
              className="px-8"
            >
              <Users className="h-5 w-5 mr-2" />
              Become an Instructor
            </Button>
            <Button
              onClick={() => navigate("/marketplace")}
              variant="outline"
              size="lg"
              className="px-8"
            >
              <Heart className="h-5 w-5 mr-2" />
              Explore Patterns
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
