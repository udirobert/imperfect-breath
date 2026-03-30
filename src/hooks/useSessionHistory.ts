import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO, isToday } from 'date-fns';
import { BREATHING_PATTERNS } from '../lib/breathingPatterns';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { OfflineManager, type OfflineSession } from '../lib/offline/OfflineManager';
import type { Database } from '../integrations/supabase/types';

type SessionRecordFromDb = Database['public']['Tables']['sessions']['Row'];

interface GuestSession {
  id: string;
  pattern_name: string;
  breath_hold_time: number;
  restlessness_score: number;
  session_duration: number;
  created_at: string;
  synced: boolean;
}

export type SessionInput = {
  breathHoldTime: number;
  restlessnessScore: number;
  sessionDuration: number;
  patternName: string;
};

const calculateStreak = (history: SessionRecordFromDb[]): number => {
  if (history.length === 0) return 0;

  const uniqueDays = history
    .map(session => parseISO(session.created_at))
    .sort((a, b) => b.getTime() - a.getTime())
    .filter((date, index, self) => 
      index === self.findIndex(d => differenceInCalendarDays(date, d) === 0)
    );

  if (uniqueDays.length === 0) return 0;

  let streak = 0;
  if (isToday(uniqueDays[0]) || differenceInCalendarDays(new Date(), uniqueDays[0]) === 1) {
      streak = 1;
      for (let i = 0; i < uniqueDays.length - 1; i++) {
          if (differenceInCalendarDays(uniqueDays[i], uniqueDays[i+1]) === 1) {
              streak++;
          } else {
              break;
          }
      }
      if (!isToday(uniqueDays[0]) && differenceInCalendarDays(new Date(), uniqueDays[0]) > 1) {
        return 0;
      }
  }
  
  return streak;
};

const calculateTotalMinutes = (history: SessionRecordFromDb[]): number => {
  const totalSeconds = history.reduce((acc, session) => acc + (session.session_duration || 0), 0);
  return Math.floor(totalSeconds / 60);
};

const calculateLongestBreathHold = (history: SessionRecordFromDb[]): number => {
  if (history.length === 0) return 0;
  return Math.max(0, ...history.map(s => s.breath_hold_time));
};

const calculateAverageRestlessness = (history: SessionRecordFromDb[]): number => {
    if (history.length === 0) return 0;
    const sessionsWithScore = history.filter(s => typeof s.restlessness_score === 'number');
    if (sessionsWithScore.length === 0) return 0;
    const totalRestlessness = sessionsWithScore.reduce((acc, session) => acc + session.restlessness_score, 0);
    return Math.round(totalRestlessness / sessionsWithScore.length);
};

const calculatePreferredPattern = (history: SessionRecordFromDb[]): string => {
    if (history.length === 0) return 'None';
    const patternCounts = history.reduce((acc, session) => {
        acc[session.pattern_name] = (acc[session.pattern_name] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (Object.keys(patternCounts).length === 0) return 'None';

    const preferredPatternKey = Object.keys(patternCounts).reduce((a, b) => patternCounts[a] > patternCounts[b] ? a : b);
    const patternDetails = BREATHING_PATTERNS[preferredPatternKey as keyof typeof BREATHING_PATTERNS];
    return patternDetails?.name || 'Unknown';
};

const convertOfflineSessionToGuestSession = (offlineSession: OfflineSession): GuestSession => ({
  id: offlineSession.id,
  pattern_name: offlineSession.patternName,
  breath_hold_time: offlineSession.breathHoldTime,
  restlessness_score: offlineSession.restlessnessScore || 0,
  session_duration: offlineSession.duration,
  created_at: offlineSession.startTime instanceof Date ? offlineSession.startTime.toISOString() : new Date(offlineSession.startTime).toISOString(),
  synced: offlineSession.synced,
});

export const useSessionHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const offlineManager = useMemo(() => OfflineManager.getInstance(), []);

  const fetchOfflineSessions = useCallback((): GuestSession[] => {
    const offlineSessions = offlineManager.getSessions();
    return offlineSessions.map(convertOfflineSessionToGuestSession);
  }, [offlineManager]);

  const fetchHistory = async (): Promise<SessionRecordFromDb[]> => {
    if (!user) {
      return fetchOfflineSessions();
    }
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching session history:', error);
      const offlineSessions = fetchOfflineSessions();
      return offlineSessions;
    }
    return data || [];
  };

  const { data: history = [], isLoading } = useQuery<SessionRecordFromDb[] | GuestSession[]>({
    queryKey: ['sessionHistory', user?.id],
    queryFn: fetchHistory,
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (newSession: Omit<Database['public']['Tables']['sessions']['Insert'], 'user_id'>) => {
      if (!user) {
        offlineManager.saveSession({
          patternId: newSession.pattern_name || 'custom',
          patternName: newSession.pattern_name || 'Custom',
          startTime: new Date(Date.now() - (newSession.session_duration || 0) * 1000),
          endTime: new Date(),
          duration: newSession.session_duration || 0,
          cycleCount: Math.floor((newSession.session_duration || 0) / 20),
          breathHoldTime: newSession.breath_hold_time || 0,
          restlessnessScore: newSession.restlessness_score || 0,
          completed: true,
        });
        return;
      }
      
      const sessionToSave = {
        ...newSession,
        user_id: user.id
      };
      
      const { error } = await supabase.from('sessions').insert(sessionToSave);

      if (error) {
        console.error('Error saving session:', error);
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionHistory', user?.id] });
    },
  });

  const saveSession = useCallback((newSession: SessionInput) => {
    const sessionForDb = {
      breath_hold_time: newSession.breathHoldTime,
      restlessness_score: newSession.restlessnessScore,
      session_duration: newSession.sessionDuration,
      pattern_name: newSession.patternName,
    };
    return saveSessionMutation.mutate(sessionForDb);
  }, [saveSessionMutation]);

  const isGuestMode = !user;
  
  const combinedHistory = useMemo(() => {
    const offlineSessions = fetchOfflineSessions();
    const cloudSessions = Array.isArray(history) ? history.filter((s): s is SessionRecordFromDb => 'user_id' in (s || {})) : [];
    const guestSessions = Array.isArray(history) ? history.filter((s): s is GuestSession => 'synced' in (s || {})) : [];
    
    if (user && offlineSessions.length > 0) {
      return [...guestSessions, ...cloudSessions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return history as GuestSession[];
  }, [history, user, fetchOfflineSessions]);

  return { 
    history: combinedHistory,
    isGuestMode,
    isLoading,
    streak: calculateStreak(combinedHistory as SessionRecordFromDb[]), 
    totalMinutes: calculateTotalMinutes(combinedHistory as SessionRecordFromDb[]), 
    saveSession, 
    longestBreathHold: calculateLongestBreathHold(combinedHistory as SessionRecordFromDb[]), 
    averageRestlessness: calculateAverageRestlessness(combinedHistory as SessionRecordFromDb[]), 
    preferredPattern: calculatePreferredPattern(combinedHistory as SessionRecordFromDb[]) 
  };
};
