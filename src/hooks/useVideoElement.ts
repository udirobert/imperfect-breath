/**
 * Consolidated Video Element Management Hook
 *
 * SINGLE SOURCE OF TRUTH for all video element operations.
 * Consolidates video setup, stream attachment, and ready state detection.
 *
 * Design Principles:
 * - DRY: Single place for all video element management
 * - CLEAN: Clear separation of video and vision concerns
 * - MODULAR: Reusable across different components
 * - PERFORMANT: Optimized event handling and polling
 * - ROBUST: Comprehensive error handling and fallbacks
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface VideoElementState {
    isReady: boolean;
    hasStream: boolean;
    dimensions: { width: number; height: number } | null;
    error: string | null;
}

export interface UseVideoElementOptions {
    autoPlay?: boolean;
    muted?: boolean;
    mirror?: boolean; // For selfie mode
    onReady?: () => void;
    onError?: (error: string) => void;
}

export const useVideoElement = (
    videoRef: React.RefObject<HTMLVideoElement>,
    stream: MediaStream | null,
    options: UseVideoElementOptions = {}
) => {
    const {
        autoPlay = true,
        muted = true,
        mirror = true,
        onReady,
        onError
    } = options;

    const [state, setState] = useState<VideoElementState>({
        isReady: false,
        hasStream: false,
        dimensions: null,
        error: null,
    });

    const isReadyRef = useRef(false);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Consolidated video element setup
    const setupVideoElement = useCallback((video: HTMLVideoElement) => {
        // Set video properties
        video.muted = muted;
        video.autoplay = autoPlay;
        video.playsInline = true;

        if (mirror) {
            video.style.transform = 'scaleX(-1)'; // Mirror for selfie mode
        }

        // Set styling for proper display
        video.style.display = 'block';
        video.style.visibility = 'visible';
        video.style.opacity = '1';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';

        console.log('📹 Video element configured with options:', options);
    }, [muted, autoPlay, mirror, options]);

    // Robust ready state detection
    const checkVideoReady = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const hasStream = !!video.srcObject;
        const hasDimensions = video.videoWidth > 0 && video.videoHeight > 0;
        const isReadyState = video.readyState >= 2;
        const canPlay = hasStream && hasDimensions && isReadyState;

        if (canPlay && !isReadyRef.current) {
            isReadyRef.current = true;
            const newState: VideoElementState = {
                isReady: true,
                hasStream: true,
                dimensions: { width: video.videoWidth, height: video.videoHeight },
                error: null,
            };

            setState(newState);
            onReady?.();
            console.log("✅ Video element fully ready:", newState);
        } else if (!canPlay && isReadyRef.current) {
            // Reset if video becomes unready
            isReadyRef.current = false;
            setState(prev => ({ ...prev, isReady: false, hasStream: hasStream }));
        }
    }, [videoRef, onReady]);

    // Handle video errors
    const handleVideoError = useCallback((error: Event) => {
        const errorMessage = 'Video element error occurred';
        console.error("❌ Video element error:", error);

        setState(prev => ({
            ...prev,
            error: errorMessage,
            isReady: false
        }));

        onError?.(errorMessage);
    }, [onError]);

    // Attach stream to video element
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream) return;

        if (video.srcObject !== stream) {
            console.log("📹 Attaching camera stream to video element");
            video.srcObject = stream;
            setupVideoElement(video);

            // Try to play video with retry mechanism
            const playVideo = async (retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        await video.play();
                        console.log('✅ Video is playing, readyState:', video.readyState);
                        return;
                    } catch (playError) {
                        console.warn(`⚠️ Video play attempt ${i + 1} failed:`, playError);
                        if (i < retries - 1) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    }
                }
                console.warn('⚠️ All video play attempts failed');
            };

            playVideo();
        }
    }, [stream, videoRef, setupVideoElement]);

    // Set up event listeners and polling
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Set up event listeners
        const events = ['loadedmetadata', 'canplay', 'canplaythrough', 'playing', 'error'];
        const handlers = {
            loadedmetadata: checkVideoReady,
            canplay: checkVideoReady,
            canplaythrough: checkVideoReady,
            playing: checkVideoReady,
            error: handleVideoError,
        };

        events.forEach(event => {
            video.addEventListener(event, handlers[event as keyof typeof handlers]);
        });

        // Set up polling for edge cases
        pollIntervalRef.current = setInterval(checkVideoReady, 100);

        // Check initial state
        checkVideoReady();

        return () => {
            events.forEach(event => {
                video.removeEventListener(event, handlers[event as keyof typeof handlers]);
            });
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [videoRef, checkVideoReady, handleVideoError]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    return {
        ...state,
        ref: videoRef,
        setupVideoElement,
    };
};