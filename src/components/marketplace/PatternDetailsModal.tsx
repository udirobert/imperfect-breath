/**
 * Pattern Details Modal Component
 * Detailed view of a pattern with all information and actions
 */

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Play,
  Star,
  Clock,
  Users,
  Heart,
  Brain,
  Target,
  Zap,
  Moon,
  Award,
  Video,
  Volume2,
  DollarSign,
  Download,
  Share,
  BookOpen,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import type { EnhancedCustomPattern } from "../../types/patterns";
import { PatternReviewForm } from "./PatternReviewForm";
import { ReviewService, PatternReview } from "../../lib/reviewService";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { PurchaseFlow } from "./PurchaseFlow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Shield, ShieldCheck } from "lucide-react";
import { formatDuration } from "../../lib/utils/formatters";

const reviewService = new ReviewService();

interface PatternDetailsModalProps {
  pattern: EnhancedCustomPattern | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (pattern: EnhancedCustomPattern) => void;
  onPurchase?: (pattern: EnhancedCustomPattern) => void;
  onLike?: (patternId: string) => void;
  isLiked?: boolean;
  hasAccess?: boolean;
}

const categoryIcons = {
  stress: Heart,
  sleep: Moon,
  energy: Zap,
  focus: Target,
  performance: Award,
};

export const PatternDetailsModal: React.FC<PatternDetailsModalProps> = ({
  pattern,
  isOpen,
  onClose,
  onPlay,
  onPurchase,
  onLike,
  isLiked = false,
  hasAccess = true,
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PatternReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (pattern) {
      setLoadingReviews(true);
      reviewService
        .getReviewsForPattern(pattern.id as string)
        .then(setReviews)
        .catch((error) => {
          console.error("Error fetching reviews:", error);
          // Show error state instead of silently failing
          setReviews([]);
        })
        .finally(() => setLoadingReviews(false));
    }
  }, [pattern]);

  if (!pattern) return null;

  const handleReviewSubmit = async (rating: number, reviewText: string) => {
    if (!user) {
      alert("You must be logged in to submit a review.");
      return;
    }
    await reviewService.submitReview({
      pattern_id: pattern.id as string,
      user_id: user.id,
      rating,
      review_text: reviewText,
    });
    // Refresh reviews
    setLoadingReviews(true);
    reviewService
      .getReviewsForPattern(pattern.id)
      .then(setReviews)
      .finally(() => setLoadingReviews(false));
  };

  const CategoryIcon =
    categoryIcons[pattern.category as keyof typeof categoryIcons] || Heart;

  // Using consolidated formatDuration from utils

  const getInstructorInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Calculate the rating from reviews, or use fallback values if not available
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const reviewCount = reviews.length;
  const sessionCount = pattern.sessionCount || 0;
  const isPremium = pattern.access.type === "premium";
  const needsPurchase = isPremium && !hasAccess;

  const handlePlay = () => {
    if (needsPurchase && onPurchase) {
      onPurchase(pattern);
    } else {
      onPlay(pattern);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isPurchasing ? (
          <PurchaseFlow
            pattern={pattern}
            onPurchaseComplete={(licenseId) => {
              console.log("Purchase complete, license ID:", licenseId);
              setIsPurchasing(false);
              // Here you would typically refetch user licenses or update state
              // to reflect that the user now has access.
              onPlay(pattern); // For demo, proceed to play after purchase
            }}
            onCancel={() => setIsPurchasing(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">Pattern Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={pattern.instructorAvatar} />
                    <AvatarFallback className="text-lg">
                      {getInstructorInitials(
                        pattern.instructorName || pattern.creator
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold">{pattern.name}</h1>
                    <p className="text-muted-foreground">
                      by {pattern.instructorName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating}</span>
                        <span className="text-muted-foreground">
                          ({reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{sessionCount.toLocaleString()} sessions</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price/Actions */}
                <div className="text-right space-y-2">
                  {isPremium ? (
                    <div className="text-2xl font-bold text-primary">
                      {pattern.access.price}{" "}
                      {pattern.access.currency}
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      Free
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLike?.(pattern.id as string)}
                      className={isLiked ? "text-red-500 border-red-500" : ""}
                    >
                      <Heart
                        className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                      />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <CategoryIcon className="h-5 w-5" />
                  <span className="capitalize">{pattern.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{formatDuration(pattern.duration)}</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {pattern.difficulty}
                </Badge>
                {pattern.hasProgressTracking && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Progress Tracking
                  </Badge>
                )}
                {pattern.hasAIFeedback && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Feedback
                  </Badge>
                )}
              </div>

              {/* Main Content */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="phases">Phases</TabsTrigger>
                  <TabsTrigger value="benefits">Benefits</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                  <TabsTrigger value="access">Access</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {pattern.description}
                    </p>
                  </div>

                  {pattern.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {pattern.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {pattern.targetAudience.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Target Audience</h3>
                      <div className="flex flex-wrap gap-2">
                        {pattern.targetAudience.map((audience, index) => (
                          <Badge key={index} variant="secondary">
                            {audience}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Media Content */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Included Content</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        pattern.mediaContent as unknown as {
                          instructionalVideo?: boolean;
                        }
                      )?.instructionalVideo && (
                        <Card>
                          <CardContent className="p-3 flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <span className="text-sm">Instructional Video</span>
                          </CardContent>
                        </Card>
                      )}
                      {(
                        pattern.mediaContent as unknown as {
                          guidedAudio?: boolean;
                        }
                      )?.guidedAudio && (
                        <Card>
                          <CardContent className="p-3 flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            <span className="text-sm">Guided Audio</span>
                          </CardContent>
                        </Card>
                      )}
                      {(
                        pattern.mediaContent as unknown as {
                          backgroundMusic?: boolean;
                        }
                      )?.backgroundMusic && (
                        <Card>
                          <CardContent className="p-3 flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            <span className="text-sm">Background Music</span>
                          </CardContent>
                        </Card>
                      )}
                      {(
                        pattern.mediaContent as unknown as {
                          visualGuide?: boolean;
                        }
                      )?.visualGuide && (
                        <Card>
                          <CardContent className="p-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="text-sm">Visual Guide</span>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Preparation Notes */}
                  {pattern.preparationNotes && (
                    <div>
                      <h3 className="font-semibold mb-2">Preparation</h3>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {pattern.preparationNotes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="phases" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">Breathing Sequence</h3>
                    <div className="space-y-3">
                      {pattern.phases.map((phase, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <h4 className="font-medium">{phase.name}</h4>
                              </div>
                              <Badge variant="outline">{phase.duration}s</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {(phase as { text?: string }).text ||
                                `${phase.name} for ${phase.duration} seconds`}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="benefits" className="space-y-4">
                  {pattern.primaryBenefits.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mb-4">Primary Benefits</h3>
                      <div className="space-y-3">
                        {pattern.primaryBenefits.map((benefit, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Award className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                  <h4 className="font-medium">
                                    {benefit.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {benefit.description}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {benefit.evidenceLevel}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-8 w-8 mx-auto mb-2" />
                      <p>No specific benefits listed for this pattern</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">Community Reviews</h3>
                    {loadingReviews ? (
                      <p>Loading reviews...</p>
                    ) : reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-muted-foreground mt-2">
                                {review.review_text}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                By user{" "}
                                {typeof review.user_id === "string"
                                  ? review.user_id.substring(0, 6)
                                  : "Anonymous"}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p>
                        No reviews yet. Be the first to share your experience!
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Leave a Review</h3>
                    <PatternReviewForm
                      patternId={pattern.id as string}
                      onSubmit={handleReviewSubmit}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="instructor" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">About the Instructor</h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={pattern.instructorAvatar} />
                            <AvatarFallback className="text-lg">
                              {getInstructorInitials(pattern.instructorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">
                              {pattern.instructorName}
                            </h4>
                            {pattern.instructorBio && (
                              <p className="text-muted-foreground mt-1">
                                {pattern.instructorBio}
                              </p>
                            )}
                            {pattern.instructorCredentials.length > 0 && (
                              <div className="mt-3">
                                <h5 className="font-medium text-sm mb-2">
                                  Credentials
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {pattern.instructorCredentials.map(
                                    (credential, index) => (
                                      <Badge key={index} variant="secondary">
                                        {credential}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Access Tab */}
                <TabsContent value="access" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-4">Access Information</h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <h4 className="font-medium">
                                {pattern.access.type === "free" ? "Free Pattern" : "Premium Pattern"}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {pattern.access.type === "free" 
                                  ? "This pattern is freely available to all users."
                                  : `This premium pattern costs ${pattern.access.price} ${pattern.access.currency} and creates an NFT when purchased.`
                                }
                              </p>
                            </div>
                          </div>

                          {pattern.access.type === "premium" && (
                            <div className="space-y-3 mt-4">
                              <h4 className="font-medium">What You Get</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>Permanent access to the pattern</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>NFT ownership on Flow blockchain</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>Support the creator</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    if (needsPurchase) {
                      setIsPurchasing(true);
                    } else {
                      handlePlay();
                    }
                  }}
                  className="flex-1 flex items-center gap-2"
                  size="lg"
                >
                  {needsPurchase ? (
                    <>
                      <DollarSign className="h-5 w-5" />
                      Purchase & Try
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Try Pattern
                    </>
                  )}
                </Button>

                {hasAccess && (
                  <Button variant="outline" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Download
                  </Button>
                )}
              </div>

              {/* Post-session notes */}
              {pattern.postSessionNotes && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">After Your Session</h4>
                  <p className="text-sm text-muted-foreground">
                    {pattern.postSessionNotes}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
