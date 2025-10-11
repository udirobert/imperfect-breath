/**
 * User Preferences Store
 *
 * SINGLE SOURCE OF TRUTH for all user preferences across the application.
 * Provides persistent user settings with type safety and validation.
 *
 * Features:
 * - Persistent user preferences across sessions
 * - Type-safe preference management
 * - Validation and defaults for all preferences
 * - Migration support for preference schema changes
 * - Reset to defaults functionality
 * - Export/import user preferences
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES - Comprehensive preference structure
// ============================================================================

export interface VisionPreferences {
    showFaceMesh: boolean;
    showRestlessnessScore: boolean;
    showPostureFeedback: boolean;
    enableFaceTracking: boolean;
    enableMovementAnalysis: boolean;
    faceMeshOpacity: number; // 0-100
    landmarkSize: 'small' | 'medium' | 'large';
    showConfidenceScores: boolean;
}

export interface AudioPreferences {
    enableVoiceGuidance: boolean;
    enableBreathingSounds: boolean;
    enableBackgroundMusic: boolean;
    voiceVolume: number; // 0-100
    soundVolume: number; // 0-100
    musicVolume: number; // 0-100
    selectedVoice: string;
    enableSoundEffects: boolean;
}

export interface PerformancePreferences {
    qualityLevel: 'low' | 'medium' | 'high' | 'auto';
    maxFPS: number;
    enableAdaptivePerformance: boolean;
    enableBatterySaver: boolean;
    enableHardwareAcceleration: boolean;
    maxConcurrentOperations: number;
}

export interface UIPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    showAdvancedMetrics: boolean;
    compactMode: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
    showTooltips: boolean;
    enableNotifications: boolean;
    notificationDuration: number; // milliseconds
    showProgressIndicators: boolean;
}

export interface SessionPreferences {
    defaultSessionDuration: number; // minutes
    defaultPattern: string;
    autoStartSessions: boolean;
    pauseOnInactivity: boolean;
    inactivityTimeout: number; // minutes
    enableSessionReminders: boolean;
    reminderInterval: number; // minutes
    saveSessionHistory: boolean;
    maxSessionHistory: number;
}

export interface AccessibilityPreferences {
    enableHighContrast: boolean;
    reduceAnimations: boolean;
    largeText: boolean;
    enableScreenReader: boolean;
    enableKeyboardNavigation: boolean;
    focusIndicators: boolean;
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface PatternPreferences {
    favoritePatterns: string[];
    completedSessions: string[];
    preferredGoals: string[];
    timePreferences: Record<string, string[]>; // Time of day -> pattern IDs
    effectivenessRatings: Record<string, number>; // Pattern ID -> 1-5 rating
    difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
    // Blockchain enhancement points (null until connected)
    onchainAchievements?: null;
    nftPatterns?: null;
}

export interface UserPreferences {
    vision: VisionPreferences;
    audio: AudioPreferences;
    performance: PerformancePreferences;
    ui: UIPreferences;
    session: SessionPreferences;
    accessibility: AccessibilityPreferences;
    patterns: PatternPreferences;
    lastUpdated: number;
    version: string; // For migration support
}

export interface PreferencesActions {
    // Core preference management
    updateVisionPreferences: (preferences: Partial<VisionPreferences>) => void;
    updateAudioPreferences: (preferences: Partial<AudioPreferences>) => void;
    updatePerformancePreferences: (preferences: Partial<PerformancePreferences>) => void;
    updateUIPreferences: (preferences: Partial<UIPreferences>) => void;
    updateSessionPreferences: (preferences: Partial<SessionPreferences>) => void;
    updateAccessibilityPreferences: (preferences: Partial<AccessibilityPreferences>) => void;
    updatePatternPreferences: (preferences: Partial<PatternPreferences>) => void;

    // Batch updates
    updatePreferences: (updates: Partial<UserPreferences>) => void;

    // Reset functionality
    resetToDefaults: (scope?: 'all' | 'vision' | 'audio' | 'performance' | 'ui' | 'session' | 'accessibility' | 'patterns') => void;
    resetVisionPreferences: () => void;
    resetAudioPreferences: () => void;
    resetPerformancePreferences: () => void;
    resetUIPreferences: () => void;
    resetSessionPreferences: () => void;
    resetAccessibilityPreferences: () => void;
    resetPatternPreferences: () => void;

    // Import/Export
    exportPreferences: () => UserPreferences;
    importPreferences: (preferences: Partial<UserPreferences>) => boolean;

    // Validation
    validatePreferences: (preferences: Partial<UserPreferences>) => { isValid: boolean; errors: string[] };

    // Migration
    migratePreferences: (fromVersion: string, toVersion: string) => boolean;
}

// ============================================================================
// CONSTANTS - Default preferences
// ============================================================================

const DEFAULT_VISION_PREFERENCES: VisionPreferences = {
    showFaceMesh: true,
    showRestlessnessScore: true,
    showPostureFeedback: true,
    enableFaceTracking: true,
    enableMovementAnalysis: true,
    faceMeshOpacity: 70,
    landmarkSize: 'medium',
    showConfidenceScores: false,
};

const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
    enableVoiceGuidance: true,
    enableBreathingSounds: false,
    enableBackgroundMusic: false,
    voiceVolume: 80,
    soundVolume: 60,
    musicVolume: 40,
    selectedVoice: 'default',
    enableSoundEffects: true,
};

const DEFAULT_PERFORMANCE_PREFERENCES: PerformancePreferences = {
    qualityLevel: 'auto',
    maxFPS: 30,
    enableAdaptivePerformance: true,
    enableBatterySaver: false,
    enableHardwareAcceleration: true,
    maxConcurrentOperations: 3,
};

const DEFAULT_UI_PREFERENCES: UIPreferences = {
    theme: 'system',
    language: 'en',
    showAdvancedMetrics: false,
    compactMode: false,
    animationSpeed: 'normal',
    showTooltips: true,
    enableNotifications: true,
    notificationDuration: 3000,
    showProgressIndicators: true,
};

const DEFAULT_SESSION_PREFERENCES: SessionPreferences = {
    defaultSessionDuration: 10,
    defaultPattern: '4-7-8',
    autoStartSessions: false,
    pauseOnInactivity: true,
    inactivityTimeout: 5,
    enableSessionReminders: false,
    reminderInterval: 30,
    saveSessionHistory: true,
    maxSessionHistory: 50,
};

const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
    enableHighContrast: false,
    reduceAnimations: false,
    largeText: false,
    enableScreenReader: false,
    enableKeyboardNavigation: true,
    focusIndicators: true,
    colorBlindMode: 'none',
};

const DEFAULT_PATTERN_PREFERENCES: PatternPreferences = {
    favoritePatterns: [],
    completedSessions: [],
    preferredGoals: [],
    timePreferences: {},
    effectivenessRatings: {},
    difficultyPreference: 'beginner',
    onchainAchievements: null,
    nftPatterns: null,
};

const DEFAULT_PREFERENCES: UserPreferences = {
    vision: DEFAULT_VISION_PREFERENCES,
    audio: DEFAULT_AUDIO_PREFERENCES,
    performance: DEFAULT_PERFORMANCE_PREFERENCES,
    ui: DEFAULT_UI_PREFERENCES,
    session: DEFAULT_SESSION_PREFERENCES,
    accessibility: DEFAULT_ACCESSIBILITY_PREFERENCES,
    patterns: DEFAULT_PATTERN_PREFERENCES,
    lastUpdated: Date.now(),
    version: '1.0.0',
};

const CURRENT_VERSION = '1.0.0';

// ============================================================================
// STORE - User preferences with comprehensive actions
// ============================================================================

export const usePreferencesStore = create<UserPreferences & PreferencesActions>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                ...DEFAULT_PREFERENCES,

                // Vision preferences
                updateVisionPreferences: (preferences: Partial<VisionPreferences>) => {
                    set((state) => ({
                        vision: { ...state.vision, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // Audio preferences
                updateAudioPreferences: (preferences: Partial<AudioPreferences>) => {
                    set((state) => ({
                        audio: { ...state.audio, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // Performance preferences
                updatePerformancePreferences: (preferences: Partial<PerformancePreferences>) => {
                    set((state) => ({
                        performance: { ...state.performance, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // UI preferences
                updateUIPreferences: (preferences: Partial<UIPreferences>) => {
                    set((state) => ({
                        ui: { ...state.ui, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // Session preferences
                updateSessionPreferences: (preferences: Partial<SessionPreferences>) => {
                    set((state) => ({
                        session: { ...state.session, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // Accessibility preferences
                updateAccessibilityPreferences: (preferences: Partial<AccessibilityPreferences>) => {
                    set((state) => ({
                        accessibility: { ...state.accessibility, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // Pattern preferences
                updatePatternPreferences: (preferences: Partial<PatternPreferences>) => {
                    set((state) => ({
                        patterns: { ...state.patterns, ...preferences },
                        lastUpdated: Date.now(),
                    }));
                },

                // Batch updates
                updatePreferences: (updates: Partial<UserPreferences>) => {
                    const validated = get().validatePreferences(updates);
                    if (validated.isValid) {
                        set((state) => ({
                            ...state,
                            ...updates,
                            lastUpdated: Date.now(),
                        }));
                    } else {
                        console.warn('Invalid preferences update:', validated.errors);
                    }
                },

                // Reset functionality
                resetToDefaults: (scope = 'all') => {
                    const resetData: Partial<UserPreferences> = { lastUpdated: Date.now() };

                    if (scope === 'all' || scope === 'vision') {
                        resetData.vision = DEFAULT_VISION_PREFERENCES;
                    }
                    if (scope === 'all' || scope === 'audio') {
                        resetData.audio = DEFAULT_AUDIO_PREFERENCES;
                    }
                    if (scope === 'all' || scope === 'performance') {
                        resetData.performance = DEFAULT_PERFORMANCE_PREFERENCES;
                    }
                    if (scope === 'all' || scope === 'ui') {
                        resetData.ui = DEFAULT_UI_PREFERENCES;
                    }
                    if (scope === 'all' || scope === 'session') {
                        resetData.session = DEFAULT_SESSION_PREFERENCES;
                    }
                    if (scope === 'all' || scope === 'accessibility') {
                        resetData.accessibility = DEFAULT_ACCESSIBILITY_PREFERENCES;
                    }
                    if (scope === 'all' || scope === 'patterns') {
                        resetData.patterns = DEFAULT_PATTERN_PREFERENCES;
                    }

                    set(resetData);
                    console.log(`🔄 PreferencesStore: Reset ${scope} preferences to defaults`);
                },

                resetVisionPreferences: () => get().resetToDefaults('vision'),
                resetAudioPreferences: () => get().resetToDefaults('audio'),
                resetPerformancePreferences: () => get().resetToDefaults('performance'),
                resetUIPreferences: () => get().resetToDefaults('ui'),
                resetSessionPreferences: () => get().resetToDefaults('session'),
                resetAccessibilityPreferences: () => get().resetToDefaults('accessibility'),
                resetPatternPreferences: () => get().resetToDefaults('patterns'),

                // Import/Export
                exportPreferences: () => {
                    const state = get();
                    return {
                        ...state,
                        lastUpdated: Date.now(),
                    };
                },

                importPreferences: (preferences: Partial<UserPreferences>) => {
                    const validated = get().validatePreferences(preferences);
                    if (validated.isValid) {
                        set((state) => ({
                            ...state,
                            ...preferences,
                            lastUpdated: Date.now(),
                        }));
                        console.log('✅ PreferencesStore: Successfully imported preferences');
                        return true;
                    } else {
                        console.error('❌ PreferencesStore: Failed to import preferences:', validated.errors);
                        return false;
                    }
                },

                // Validation
                validatePreferences: (preferences: Partial<UserPreferences>) => {
                    const errors: string[] = [];

                    // Vision validation
                    if (preferences.vision) {
                        const v = preferences.vision;
                        if (v.faceMeshOpacity !== undefined && (v.faceMeshOpacity < 0 || v.faceMeshOpacity > 100)) {
                            errors.push('Vision faceMeshOpacity must be between 0 and 100');
                        }
                    }

                    // Audio validation
                    if (preferences.audio) {
                        const a = preferences.audio;
                        if (a.voiceVolume !== undefined && (a.voiceVolume < 0 || a.voiceVolume > 100)) {
                            errors.push('Audio voiceVolume must be between 0 and 100');
                        }
                        if (a.soundVolume !== undefined && (a.soundVolume < 0 || a.soundVolume > 100)) {
                            errors.push('Audio soundVolume must be between 0 and 100');
                        }
                        if (a.musicVolume !== undefined && (a.musicVolume < 0 || a.musicVolume > 100)) {
                            errors.push('Audio musicVolume must be between 0 and 100');
                        }
                    }

                    // Performance validation
                    if (preferences.performance) {
                        const p = preferences.performance;
                        if (p.maxFPS !== undefined && p.maxFPS < 1) {
                            errors.push('Performance maxFPS must be at least 1');
                        }
                        if (p.maxConcurrentOperations !== undefined && p.maxConcurrentOperations < 1) {
                            errors.push('Performance maxConcurrentOperations must be at least 1');
                        }
                    }

                    // UI validation
                    if (preferences.ui) {
                        const u = preferences.ui;
                        if (u.notificationDuration !== undefined && u.notificationDuration < 1000) {
                            errors.push('UI notificationDuration must be at least 1000ms');
                        }
                    }

                    // Session validation
                    if (preferences.session) {
                        const s = preferences.session;
                        if (s.defaultSessionDuration !== undefined && s.defaultSessionDuration < 1) {
                            errors.push('Session defaultSessionDuration must be at least 1 minute');
                        }
                        if (s.inactivityTimeout !== undefined && s.inactivityTimeout < 1) {
                            errors.push('Session inactivityTimeout must be at least 1 minute');
                        }
                        if (s.maxSessionHistory !== undefined && s.maxSessionHistory < 0) {
                            errors.push('Session maxSessionHistory must be non-negative');
                        }
                    }

                    return {
                        isValid: errors.length === 0,
                        errors,
                    };
                },

                // Migration
                migratePreferences: (fromVersion: string, toVersion: string) => {
                    // Simple migration logic - could be enhanced for complex migrations
                    if (fromVersion === toVersion) {
                        return true;
                    }

                    console.log(`🔄 PreferencesStore: Migrating preferences from ${fromVersion} to ${toVersion}`);

                    // Example migration: Add new default preferences
                    if (fromVersion < '1.0.0') {
                        // Add any new preferences that didn't exist in older versions
                        set((state) => ({
                            ...state,
                            version: toVersion,
                            lastUpdated: Date.now(),
                        }));
                    }

                    return true;
                },
            }),
            {
                name: 'preferences-store',
                version: 1,
                migrate: (persistedState: any, version: number) => {
                    // Migration logic for persisted state
                    const state = persistedState as Partial<UserPreferences>;

                    // Ensure all required fields exist
                    const migratedState: UserPreferences = {
                        ...DEFAULT_PREFERENCES,
                        ...state,
                        version: CURRENT_VERSION,
                        lastUpdated: Date.now(),
                    };

                    return migratedState;
                },
            }
        )
    )
);

// ============================================================================
// SELECTORS - Optimized state access
// ============================================================================

// Custom hooks for preferences selectors
export const usePreferencesVision = () => usePreferencesStore((state) => state.vision);
export const usePreferencesAudio = () => usePreferencesStore((state) => state.audio);
export const usePreferencesPerformance = () => usePreferencesStore((state) => state.performance);
export const usePreferencesUI = () => usePreferencesStore((state) => state.ui);
export const usePreferencesSession = () => usePreferencesStore((state) => state.session);
export const usePreferencesAccessibility = () => usePreferencesStore((state) => state.accessibility);
export const usePreferencesPatterns = () => usePreferencesStore((state) => state.patterns);
export const usePreferencesShowFaceMesh = () => usePreferencesStore((state) => state.vision.showFaceMesh);
export const usePreferencesEnableVoiceGuidance = () => usePreferencesStore((state) => state.audio.enableVoiceGuidance);
export const usePreferencesTheme = () => usePreferencesStore((state) => state.ui.theme);
export const usePreferencesQualityLevel = () => usePreferencesStore((state) => state.performance.qualityLevel);
export const usePreferencesDefaultSessionDuration = () => usePreferencesStore((state) => state.session.defaultSessionDuration);

// ============================================================================
// HOOKS - Clean, focused hooks for components
// ============================================================================

export const useVisionPreferences = () => usePreferencesStore((state) => state.vision);
export const useAudioPreferences = () => usePreferencesStore((state) => state.audio);
export const usePerformancePreferences = () => usePreferencesStore((state) => state.performance);
export const useUIPreferences = () => usePreferencesStore((state) => state.ui);
export const useSessionPreferences = () => usePreferencesStore((state) => state.session);
export const useAccessibilityPreferences = () => usePreferencesStore((state) => state.accessibility);
export const usePatternPreferences = () => usePreferencesStore((state) => state.patterns);

export default usePreferencesStore;