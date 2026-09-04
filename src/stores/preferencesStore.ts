/**
 * User Preferences Store (partial reintegration).
 *
 * The full 523-line preferencesStore was deleted in round 3. This restores
 * just the Session and Audio domains — the two that serve the reintegrated
 * voice guidance and default-pattern selection. Vision/performance/UI/
 * accessibility domains are deliberately omitted (they fed buried surfaces).
 *
 * Persisted to localStorage via Zustand persist middleware. Typed, validated,
 * with defaults. Gives voice guidance and default pattern a real home.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AudioPreferences {
  enableVoiceGuidance: boolean;
  voiceVolume: number; // 0-100
  enablePhaseCues: boolean;
  cueRate: number; // 0.5-1.5 (speech rate)
}

export interface SessionPreferences {
  defaultPatternId: string;
  pauseOnInactivity: boolean;
  inactivityTimeoutMinutes: number;
  saveSessionHistory: boolean;
}

export interface PreferencesState {
  audio: AudioPreferences;
  session: SessionPreferences;
}

export interface PreferencesActions {
  setAudio: (patch: Partial<AudioPreferences>) => void;
  setSession: (patch: Partial<SessionPreferences>) => void;
  reset: () => void;
}

const DEFAULTS: PreferencesState = {
  audio: {
    enableVoiceGuidance: true,
    voiceVolume: 90,
    enablePhaseCues: true,
    cueRate: 0.85,
  },
  session: {
    defaultPatternId: "box",
    pauseOnInactivity: false,
    inactivityTimeoutMinutes: 5,
    saveSessionHistory: true,
  },
};

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setAudio: (patch) => set((s) => ({ audio: { ...s.audio, ...patch } })),
      setSession: (patch) => set((s) => ({ session: { ...s.session, ...patch } })),
      reset: () => set(DEFAULTS),
    }),
    {
      name: "brume-preferences",
      // Only persist the data, not the actions.
      partialize: (s) => ({ audio: s.audio, session: s.session }),
    },
  ),
);

// Convenience selectors
export const useAudioPrefs = () => usePreferencesStore((s) => s.audio);
export const useSessionPrefs = () => usePreferencesStore((s) => s.session);
