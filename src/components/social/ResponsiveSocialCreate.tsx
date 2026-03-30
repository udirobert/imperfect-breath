/**
 * Responsive Social Create - Unified Social Post Creation
 *
 * Single component for both mobile and desktop with responsive design
 */

import React, { useState } from "react";
import { isTouchDevice } from "../../utils/mobile-detection";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { 
  Share2, 
  Image, 
  Tag, 
  Calendar, 
  TrendingUp, 
  Flame,
  Check,
  X
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PersonalizedTemplates } from "../../lib/social/PersonalizedTemplates";

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  favoritePattern: string;
  lastSessionScore: number;
  weeklyGoalProgress: number;
}

interface ResponsiveSocialCreateProps {
  onClose?: () => void;
  prefilledStats?: Partial<SessionStats>;
  mode?: "modal" | "page";
}

interface PostFormData {
  title: string;
  content: string;
  tags: string[];
  templateId?: string;
  shareProgress: boolean;
  shareStreak: boolean;
}

export const ResponsiveSocialCreate: React.FC<ResponsiveSocialCreateProps> = ({
  onClose,
  prefilledStats,
  mode = "page",
}) => {
  const isMobile = isTouchDevice();
  const { user } = useAuth();
  const templates = PersonalizedTemplates.getTemplates();
  
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    content: "",
    tags: [],
    shareProgress: true,
    shareStreak: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const stats = prefilledStats || {
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    favoritePattern: "Box Breathing",
    lastSessionScore: 0,
    weeklyGoalProgress: 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Post created:", formData);
      onClose?.();
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const selectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        content: template.content,
        templateId
      }));
      setSelectedTemplate(templateId);
    }
  };

  const containerClass = mode === "modal" 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    : "min-h-screen p-4";

  const contentClass = isMobile 
    ? "w-full max-w-md mx-auto space-y-4" 
    : "w-full max-w-2xl mx-auto space-y-6";

  return (
    <div className={containerClass}>
      <Card className={contentClass}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Share Your Journey</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Template</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {templates.slice(0, 4).map(template => (
                  <Button
                    key={template.id}
                    type="button"
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => selectTemplate(template.id)}
                  >
                    {template.icon && <template.icon className="h-4 w-4 mr-1" />}
                    {template.title.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your post a title..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your breathing session experience..."
                rows={isMobile ? 4 : 6}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add a tag..."
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Sessions
                </div>
                <div className="text-2xl font-bold mt-1">{stats.totalSessions}</div>
                <div className="text-xs text-muted-foreground">{stats.totalMinutes} min total</div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Flame className="h-4 w-4" />
                  Streak
                </div>
                <div className="text-2xl font-bold mt-1">{stats.currentStreak}</div>
                <div className="text-xs text-muted-foreground">days</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.shareProgress}
                  onChange={e => setFormData(prev => ({ ...prev, shareProgress: e.target.checked }))}
                  className="rounded"
                />
                <TrendingUp className="h-4 w-4" />
                Share progress
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.shareStreak}
                  onChange={e => setFormData(prev => ({ ...prev, shareStreak: e.target.checked }))}
                  className="rounded"
                />
                <Flame className="h-4 w-4" />
                Share streak
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>Posting...</>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Post
                  </>
                )}
              </Button>
              {mode === "modal" && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResponsiveSocialCreate;
