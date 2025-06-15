
import React, { useEffect } from 'react';

interface VideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
}

const VideoFeed = ({ videoRef, isActive }: VideoFeedProps) => {
  useEffect(() => {
    const stopCameraFeed = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    if (isActive) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
        });
    } else {
      stopCameraFeed();
    }

    return () => {
      stopCameraFeed();
    };
  }, [isActive, videoRef]);

  return (
    <div className="absolute bottom-4 right-4 w-32 h-24 md:w-48 md:h-36 rounded-lg overflow-hidden shadow-2xl border-4 border-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};

export default VideoFeed;

