/**
 * Unified Camera State Store
 *
 * SINGLE SOURCE OF TRUTH for all camera state management.
 * Consolidates CameraContext functionality into Zustand for consistency.
 *
 * Features:
 * - Camera stream management with reference counting
 * - Permission tracking and management
 * - Device enumeration and selection
 * - Error handling and recovery
 * - Performance monitoring
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// TYPES - Comprehensive camera state structure
// ============================================================================

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error' | 'permission-denied';

export type CameraDevice = MediaDeviceInfo;

export interface CameraState {
    // Core camera state
    stream: MediaStream | null;
    status: CameraStatus;
    error: string | null;
    hasPermission: boolean;

    // Device management
    devices: CameraDevice[];
    selectedDeviceId: string | null;
    isEnumeratingDevices: boolean;

    // Reference counting for stream management
    refCount: number;

    // Performance and quality settings
    constraints: MediaStreamConstraints;
    performanceMode: 'optimal' | 'balanced' | 'minimal';

    // Error recovery
    consecutiveErrors: number;
    lastErrorTime: number | null;
}

export interface CameraActions {
    // Stream management
    requestStream: (deviceId?: string) => Promise<MediaStream | null>;
    releaseStream: () => void;
    stopStream: () => void;

    // Permission management
    checkPermission: () => Promise<boolean>;
    requestPermission: () => Promise<boolean>;

    // Device management
    refreshDevices: () => Promise<void>;
    selectDevice: (deviceId: string) => void;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;
    incrementErrorCount: () => void;
    resetErrorCount: () => void;

    // Performance
    setPerformanceMode: (mode: CameraState['performanceMode']) => void;
    updateConstraints: (constraints: Partial<MediaStreamConstraints>) => void;

    // Utilities
    getStreamHealth: () => 'healthy' | 'degraded' | 'failed';
    getRecommendedConstraints: () => MediaStreamConstraints;
}

// ============================================================================
// CONSTANTS - Camera configuration
// ============================================================================

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
    video: {
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 30, max: 30 },
        facingMode: 'user'
    }
};

const PERFORMANCE_CONSTRAINTS = {
    optimal: {
        video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
        }
    },
    balanced: {
        video: {
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 30, max: 30 }
        }
    },
    minimal: {
        video: {
            width: { ideal: 320, max: 640 },
            height: { ideal: 240, max: 480 },
            frameRate: { ideal: 15, max: 30 }
        }
    }
};

// ============================================================================
// INITIAL STATE - Clean defaults
// ============================================================================

const initialState: CameraState = {
    stream: null,
    status: 'idle',
    error: null,
    hasPermission: false,
    devices: [],
    selectedDeviceId: null,
    isEnumeratingDevices: false,
    refCount: 0,
    constraints: DEFAULT_CONSTRAINTS,
    performanceMode: 'optimal',
    consecutiveErrors: 0,
    lastErrorTime: null,
};

// ============================================================================
// STORE - Unified camera state with comprehensive actions
// ============================================================================

export const useCameraStore = create<CameraState & CameraActions>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        // Stream management with reference counting
        requestStream: async (deviceId?: string) => {
            const state = get();

            // If we already have an active stream, increment ref count
            if (state.stream && state.status === 'active') {
                set((state) => ({ refCount: state.refCount + 1 }));
                console.log(`📹 CameraStore: Stream reused, refCount: ${state.refCount + 1}`);
                return state.stream;
            }

            // If already requesting, wait for existing request
            if (state.status === 'requesting') {
                return new Promise((resolve) => {
                    const checkStatus = () => {
                        const currentState = get();
                        if (currentState.status !== 'requesting') {
                            resolve(currentState.stream);
                        } else {
                            setTimeout(checkStatus, 100);
                        }
                    };
                    checkStatus();
                });
            }

            // Start new request
            set({
                status: 'requesting',
                error: null,
                consecutiveErrors: 0
            });

            try {
                console.log('📷 CameraStore: Requesting camera stream...');

                // Update constraints if device specified
                const currentConstraints = get().constraints;
                const constraints = deviceId
                    ? {
                        ...currentConstraints,
                        video: {
                            ...(currentConstraints.video as MediaTrackConstraints),
                            deviceId: { exact: deviceId }
                        }
                    }
                    : currentConstraints;

                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                set((state) => ({
                    stream,
                    status: 'active',
                    hasPermission: true,
                    refCount: state.refCount + 1,
                    selectedDeviceId: deviceId || state.selectedDeviceId,
                    lastErrorTime: null,
                }));

                console.log(`✅ CameraStore: Stream acquired, refCount: ${get().refCount}`);

                // Refresh devices now that we have permission
                await get().refreshDevices();

                return stream;
            } catch (error) {
                console.error('❌ CameraStore: Camera request failed:', error);

                const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
                const newStatus = (error as Error).name === 'NotAllowedError' ? 'permission-denied' : 'error';

                set((state) => ({
                    error: errorMessage,
                    status: newStatus,
                    hasPermission: newStatus === 'permission-denied' ? false : state.hasPermission,
                    consecutiveErrors: state.consecutiveErrors + 1,
                    lastErrorTime: Date.now(),
                }));

                return null;
            }
        },

        releaseStream: () => {
            const state = get();
            const newRefCount = Math.max(0, state.refCount - 1);

            console.log(`📹 CameraStore: Stream reference released, refCount: ${newRefCount}`);

            set({ refCount: newRefCount });

            // Only stop the actual stream when no references remain
            if (newRefCount <= 0 && state.stream) {
                get().stopStream();
            }
        },

        stopStream: () => {
            const state = get();

            if (state.stream) {
                console.log('🛑 CameraStore: Stopping camera stream');
                state.stream.getTracks().forEach(track => track.stop());
            }

            set({
                stream: null,
                status: 'idle',
                refCount: 0,
            });
        },

        // Permission management
        checkPermission: async () => {
            if (!navigator.permissions) return get().hasPermission;

            try {
                const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
                const hasPermission = permission.state === 'granted';

                set({ hasPermission });
                return hasPermission;
            } catch {
                return get().hasPermission;
            }
        },

        requestPermission: async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop()); // Don't keep the stream
                set({ hasPermission: true });
                return true;
            } catch {
                set({ hasPermission: false });
                return false;
            }
        },

        // Device management
        refreshDevices: async () => {
            set({ isEnumeratingDevices: true });

            try {
                const mediaDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');

                set({
                    devices: videoDevices,
                    isEnumeratingDevices: false
                });
            } catch (error) {
                console.warn('Failed to enumerate devices:', error);
                set({ isEnumeratingDevices: false });
            }
        },

        selectDevice: (deviceId: string) => {
            set({ selectedDeviceId: deviceId });
        },

        // Error handling
        setError: (error: string | null) => {
            set({ error });
        },

        clearError: () => {
            set({ error: null, consecutiveErrors: 0 });
        },

        incrementErrorCount: () => {
            set((state) => ({
                consecutiveErrors: state.consecutiveErrors + 1,
                lastErrorTime: Date.now(),
            }));
        },

        resetErrorCount: () => {
            set({ consecutiveErrors: 0, lastErrorTime: null });
        },

        // Performance
        setPerformanceMode: (mode: CameraState['performanceMode']) => {
            const constraints = PERFORMANCE_CONSTRAINTS[mode];

            set((state) => ({
                performanceMode: mode,
                constraints: { ...state.constraints, ...constraints },
            }));
        },

        updateConstraints: (constraints: Partial<MediaStreamConstraints>) => {
            set((state) => ({
                constraints: { ...state.constraints, ...constraints },
            }));
        },

        // Utilities
        getStreamHealth: () => {
            const state = get();

            if (!state.stream) return 'failed';
            if (state.consecutiveErrors > 3) return 'degraded';
            if (state.status === 'active' && state.refCount > 0) return 'healthy';

            return 'degraded';
        },

        getRecommendedConstraints: () => {
            const state = get();
            const performanceMode = state.performanceMode;

            return {
                ...DEFAULT_CONSTRAINTS,
                ...PERFORMANCE_CONSTRAINTS[performanceMode],
            };
        },
    }))
);

// ============================================================================
// SELECTORS - Optimized state access
// ============================================================================

export const cameraSelectors = {
    isActive: () => useCameraStore((state) => state.status === 'active'),
    hasStream: () => useCameraStore((state) => !!state.stream),
    hasPermission: () => useCameraStore((state) => state.hasPermission),
    hasDevices: () => useCameraStore((state) => state.devices.length > 0),
    isLoading: () => useCameraStore((state) => state.status === 'requesting' || state.isEnumeratingDevices),
    hasError: () => useCameraStore((state) => !!state.error),
    streamHealth: () => useCameraStore((state) => {
        if (!state.stream) return 'failed';
        if (state.consecutiveErrors > 3) return 'degraded';
        if (state.status === 'active' && state.refCount > 0) return 'healthy';
        return 'degraded';
    }),
};

// ============================================================================
// HOOKS - Clean, focused hooks for components
// ============================================================================

export const useCameraStatus = () => useCameraStore((state) => state.status);
export const useCameraStream = () => useCameraStore((state) => state.stream);
export const useCameraDevices = () => useCameraStore((state) => state.devices);
export const useCameraError = () => useCameraStore((state) => state.error);
export const useCameraPermission = () => useCameraStore((state) => state.hasPermission);

export default useCameraStore;