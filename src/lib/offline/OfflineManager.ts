/**
 * Offline Manager for Core Features
 *
 * Enables core breathing functionality to work without internet connection
 * while maintaining data sync when connection is restored.
 */

import React from 'react';
import { BreathingPattern, BREATHING_PATTERNS } from "@/lib/breathingPatterns";
import { apiClient } from '../api/unified-client';

export interface OfflineSession {
  id: string;
  patternId: string;
  patternName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  cycleCount: number;
  breathHoldTime: number;
  restlessnessScore?: number;
  completed: boolean;
  synced: boolean;
}

export interface OfflineData {
  sessions: OfflineSession[];
  patterns: BreathingPattern[];
  userPreferences: {
    defaultPattern: string;
    voiceEnabled: boolean;
    cameraEnabled: boolean;
    lastSyncTime: Date;
  };
}

export class OfflineManager {
  private static instance: OfflineManager;
  private storageKey = 'imperfect_breath_offline';
  private syncQueue: OfflineSession[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupOnlineDetection();
    this.initializeOfflineData();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize offline data with default patterns
   */
  private initializeOfflineData(): void {
    const existingData = this.getOfflineData();
    
    if (!existingData.patterns.length) {
      // Store essential breathing patterns for offline use
      const essentialPatterns = [
        BREATHING_PATTERNS.box,
        BREATHING_PATTERNS.relaxation,
        BREATHING_PATTERNS.energy,
      ];
      
      this.saveOfflineData({
        ...existingData,
        patterns: essentialPatterns,
      });
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get offline data from localStorage
   */
  getOfflineData(): OfflineData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Safely convert date strings back to Date objects
        const safeParseDate = (dateValue: any): Date => {
          if (!dateValue) return new Date();
          try {
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          } catch {
            return new Date();
          }
        };

        data.sessions = data.sessions.map((session: any) => ({
          ...session,
          startTime: safeParseDate(session.startTime),
          endTime: session.endTime ? safeParseDate(session.endTime) : undefined,
        }));
        
        data.userPreferences.lastSyncTime = safeParseDate(data.userPreferences.lastSyncTime);
        return data;
      }
    } catch (error) {
      console.warn('Failed to load offline data:', error);
    }

    // Return default data structure
    return {
      sessions: [],
      patterns: [],
      userPreferences: {
        defaultPattern: 'box',
        voiceEnabled: true,
        cameraEnabled: false,
        lastSyncTime: new Date(),
      },
    };
  }

  /**
   * Save offline data to localStorage
   */
  private saveOfflineData(data: OfflineData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  /**
   * Save a breathing session offline
   * CLEAN: Uses 'offline_' prefix to distinguish from active session IDs
   */
  saveSession(session: Omit<OfflineSession, 'id' | 'synced'>): string {
    // ORGANIZED: Different ID format for offline storage vs active sessions
    const sessionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineSession: OfflineSession = {
      ...session,
      id: sessionId,
      synced: false,
    };

    const data = this.getOfflineData();
    data.sessions.push(offlineSession);
    this.saveOfflineData(data);

    // Add to sync queue if online
    if (this.isOnline) {
      this.syncQueue.push(offlineSession);
      this.syncPendingData();
    }

    return sessionId;
  }

  /**
   * Get all offline sessions
   */
  getSessions(): OfflineSession[] {
    return this.getOfflineData().sessions;
  }

  /**
   * Get unsynced sessions
   */
  getUnsyncedSessions(): OfflineSession[] {
    return this.getSessions().filter(session => !session.synced);
  }

  /**
   * Get available patterns for offline use
   */
  getAvailablePatterns(): BreathingPattern[] {
    const data = this.getOfflineData();
    return data.patterns.length > 0 ? data.patterns : Object.values(BREATHING_PATTERNS);
  }

  /**
   * Add pattern for offline use
   */
  addPattern(pattern: BreathingPattern): void {
    const data = this.getOfflineData();
    const existingIndex = data.patterns.findIndex(p => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      data.patterns[existingIndex] = pattern;
    } else {
      data.patterns.push(pattern);
    }
    
    this.saveOfflineData(data);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<OfflineData['userPreferences']>): void {
    const data = this.getOfflineData();
    data.userPreferences = { ...data.userPreferences, ...preferences };
    this.saveOfflineData(data);
  }

  /**
   * Get user preferences
   */
  getPreferences(): OfflineData['userPreferences'] {
    return this.getOfflineData().userPreferences;
  }

  /**
   * Sync pending data when online
   */
  private async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    try {
      // Sync sessions to server
      const sessionsToSync = [...this.syncQueue];
      this.syncQueue = [];

      for (const session of sessionsToSync) {
        await this.syncSessionToServer(session);
      }

      // Update sync status
      const data = this.getOfflineData();
      data.sessions = data.sessions.map(session => 
        sessionsToSync.find(s => s.id === session.id) 
          ? { ...session, synced: true }
          : session
      );
      data.userPreferences.lastSyncTime = new Date();
      this.saveOfflineData(data);

    } catch (error) {
      console.error('Sync failed:', error);
      // Re-add failed sessions to sync queue
      this.syncQueue.push(...this.getUnsyncedSessions());
    }
  }

  /**
   * Sync individual session to server
   */
  private async syncSessionToServer(session: OfflineSession): Promise<void> {
    // This would integrate with your actual API
    
    // Safely convert dates to ISO strings with validation
    const safeToISOString = (date: Date | undefined | null): string | undefined => {
      if (!date) return undefined;
      try {
        // Check if date is valid
        if (date instanceof Date && !isNaN(date.getTime())) {
          return date.toISOString();
        }
        // Try to create a valid date if it's a string or number
        const validDate = new Date(date);
        if (!isNaN(validDate.getTime())) {
          return validDate.toISOString();
        }
      } catch (error) {
        console.warn('Invalid date encountered during sync:', date, error);
      }
      return undefined;
    };

    const startTimeISO = safeToISOString(session.startTime);
    const endTimeISO = safeToISOString(session.endTime);

    // Skip sync if we don't have a valid start time
    if (!startTimeISO) {
      console.warn('Skipping session sync due to invalid start time:', session);
      return;
    }

    try {
      const response = await apiClient.request('social', '/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          patternId: session.patternId,
          duration: session.duration,
          cycleCount: session.cycleCount,
          breathHoldTime: session.breathHoldTime,
          restlessnessScore: session.restlessnessScore,
          startTime: startTimeISO,
          endTime: endTimeISO,
          completed: session.completed,
        }),
      });

      if (!response.success) {
        // If API endpoint doesn't exist, just log and continue
        if (response.error && response.error.includes('404')) {
          console.log('Session API endpoint not available, session saved locally only');
          return;
        }
        throw new Error(`Sync failed: ${response.error}`);
      }
    } catch (error) {
      // Handle network errors gracefully
      if (error instanceof Error && error.message.includes('network')) {
        console.log('Network error during sync, session saved locally only');
        return;
      }
      throw error;
    }
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    localStorage.removeItem(this.storageKey);
    this.syncQueue = [];
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    pendingSessions: number;
    lastSyncTime: Date;
  } {
    const preferences = this.getPreferences();
    return {
      isOnline: this.isOnline,
      pendingSessions: this.getUnsyncedSessions().length,
      lastSyncTime: preferences.lastSyncTime,
    };
  }

  /**
   * Force sync now (if online)
   */
  async forcSync(): Promise<boolean> {
    if (!this.isOnline) return false;

    const unsyncedSessions = this.getUnsyncedSessions();
    this.syncQueue.push(...unsyncedSessions);
    
    await this.syncPendingData();
    return this.getUnsyncedSessions().length === 0;
  }

  /**
   * Export offline data for backup
   */
  exportData(): string {
    return JSON.stringify(this.getOfflineData(), null, 2);
  }

  /**
   * Import offline data from backup
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      // Validate data structure
      if (data.sessions && data.patterns && data.userPreferences) {
        this.saveOfflineData(data);
        return true;
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
    return false;
  }
}

/**
 * React hook for offline functionality
 */
export const useOfflineManager = () => {
  const [manager] = React.useState(() => OfflineManager.getInstance());
  const [syncStatus, setSyncStatus] = React.useState(manager.getSyncStatus());

  React.useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(manager.getSyncStatus());
    };

    // Update sync status periodically
    const interval = setInterval(updateSyncStatus, 5000);
    
    // Update on online/offline events
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateSyncStatus);
      window.removeEventListener('offline', updateSyncStatus);
    };
  }, [manager]);

  return {
    manager,
    syncStatus,
    saveSession: manager.saveSession.bind(manager),
    getSessions: manager.getSessions.bind(manager),
    getAvailablePatterns: manager.getAvailablePatterns.bind(manager),
    addPattern: manager.addPattern.bind(manager),
    updatePreferences: manager.updatePreferences.bind(manager),
    getPreferences: manager.getPreferences.bind(manager),
    forcSync: manager.forcSync.bind(manager),
    exportData: manager.exportData.bind(manager),
    importData: manager.importData.bind(manager),
  };
};