import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { differenceInCalendarDays, parseISO, isToday } from 'date-fns';
import { BREATHING_PATTERNS } from '@/lib/breathingPatterns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type SessionRecordFromDb = Database['public']['Tables']['sessions']['Row'];
export type ISessionRecord = Omit<SessionRecordFromDb, 'id' | 'user_id' | 'created_at'> & { date: string };

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

export const useSessionHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchHistory = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching session history:', error);
      throw new Error(error.message);
    }
    return data;
  };

  const { data: history = [], isLoading } = useQuery<SessionRecordFromDb[]>({
    queryKey: ['sessionHistory', user?.id],
    queryFn: fetchHistory,
    enabled: !!user,
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (newSession: Omit<SessionRecordFromDb, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error("User must be logged in to save a session.");
      
      const sessionToSave = {
        ...newSession,
        breath_hold_time: newSession.breath_hold_time,
        restlessness_score: newSession.restlessness_score,
        session_duration: newSession.session_duration,
        pattern_name: newSession.pattern_name,
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

  const saveSession = useCallback((newSession: Omit<ISessionRecord, 'date'>) => {
    const sessionForDb = {
      breath_hold_time: newSession.breathHoldTime,
      restlessness_score: newSession.restlessnessScore,
      session_duration: newSession.sessionDuration,
      pattern_name: newSession.patternName,
    };
    return saveSessionMutation.mutate(sessionForDb);
  }, [saveSessionMutation]);

  return { 
    history, 
    isLoading,
    streak: calculateStreak(history), 
    totalMinutes: calculateTotalMinutes(history), 
    saveSession, 
    longestBreathHold: calculateLongestBreathHold(history), 
    averageRestlessness: calculateAverageRestlessness(history), 
    preferredPattern: calculatePreferredPattern(history) 
  };
};
