import React, { useState } from "react";
import { Play, Pause, Volume2, VolumeX, ExternalLink, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface MediaContent {
  type: "audio" | "video" | "image";
  url: string;
  title?: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
}

interface MediaPreviewProps {
  media: MediaContent;
  showControls?: boolean;
  className?: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  media,
  showControls = true,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const getVideoId = (url: string): string | null => {
    // YouTube URL patterns
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const getVimeoId = (url: string): string | null => {
    const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
    const match = url.match(vimeoRegex);
    return match ? match[1] : null;
  };

  const getThumbnail = (): string => {
    if (media.thumbnail) return media.thumbnail;

    if (media.type === "video") {
      const youtubeId = getVideoId(media.url);
      if (youtubeId) {
        return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      }

      const vimeoId = getVimeoId(media.url);
      if (vimeoId) {
        return `https://vumbnail.com/${vimeoId}.jpg`;
      }
    }

    return "";
  };

  const renderVideoPlayer = () => {
    const youtubeId = getVideoId(media.url);
    const vimeoId = getVimeoId(media.url);

    if (youtubeId) {
      return (
        <div className="relative w-full aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            className="w-full h-full rounded-lg"
            allowFullScreen
            title={media.title || "Video"}
          />
        </div>
      );
    }

    if (vimeoId) {
      return (
        <div className="relative w-full aspect-video">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
            className="w-full h-full rounded-lg"
            allowFullScreen
            title={media.title || "Video"}
          />
        </div>
      );
    }

    // Fallback for direct video URLs
    return (
      <video
        className="w-full aspect-video rounded-lg"
        controls={showControls}
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={media.url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  };

  const renderAudioPlayer = () => {
    // Check if it's a SoundCloud URL
    if (media.url.includes("soundcloud.com")) {
      return (
        <div className="w-full">
          <iframe
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
              media.url
            )}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
            className="rounded-lg"
          />
        </div>
      );
    }

    // Fallback for direct audio URLs
    return (
      <div className="w-full">
        <audio
          className="w-full"
          controls={showControls}
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={media.url} type="audio/mpeg" />
          <source src={media.url} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  };

  const renderImagePreview = () => {
    return (
      <div className="relative w-full">
        <img
          src={media.url}
          alt={media.title || "Image"}
          className="w-full h-auto rounded-lg object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    );
  };

  const renderPreview = () => {
    switch (media.type) {
      case "video":
        return renderVideoPlayer();
      case "audio":
        return renderAudioPlayer();
      case "image":
        return renderImagePreview();
      default:
        return null;
    }
  };

  if (!media.url) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <p>No media content added yet</p>
            <p className="text-sm mt-1">Add a URL to see the preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Media Preview */}
          <div className="relative">
            {renderPreview()}

            {/* Media Type Badge */}
            <div className="absolute top-2 left-2">
              <Badge
                variant="outline"
                className="bg-background/80 backdrop-blur-sm"
              >
                {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
              </Badge>
            </div>

            {/* External Link */}
            <div className="absolute top-2 right-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-background/80 backdrop-blur-sm"
                onClick={() => window.open(media.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Media Info */}
          {(media.title || media.description) && (
            <div className="space-y-1">
              {media.title && (
                <h4 className="font-medium text-sm">{media.title}</h4>
              )}
              {media.description && (
                <p className="text-xs text-muted-foreground">
                  {media.description}
                </p>
              )}
            </div>
          )}

          {/* URL Display */}
          <div className="text-xs text-muted-foreground truncate">
            {media.url}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaPreview;
