import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface PatternReviewFormProps {
  patternId: string;
  onSubmit: (rating: number, reviewText: string) => Promise<void>;
}

export const PatternReviewForm: React.FC<PatternReviewFormProps> = ({
  patternId,
  onSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (rate: number) => {
    setRating(rate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }
    setIsSubmitting(true);
    await onSubmit(rating, reviewText);
    setIsSubmitting(false);
    setRating(0);
    setReviewText("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Your Rating</Label>
        <div className="flex items-center gap-1 mt-1">
          {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <Star
                key={starValue}
                className={`h-6 w-6 cursor-pointer ${
                  starValue <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
                onClick={() => handleRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
              />
            );
          })}
        </div>
      </div>
      <div>
        <Label htmlFor="reviewText">Your Review</Label>
        <Textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this pattern..."
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
};
