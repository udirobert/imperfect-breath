
import { useState, useEffect, useCallback } from 'react';
import { differenceInCalendarDays, parseISO, isToday } from 'date-fns';

export interface ISessionRecord {
  date: string; // ISO string
  breathHoldTime: number; // seconds
  restlessnessScore: number; // 0-100
  sessionDuration: number; // seconds
  patternName: string;
}

const HISTORY_KEY = 'mindful-breath-history';

const getStoredHistory = (): ISessionRecord[] => {
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading session history from localStorage:', error);
    return [];
  }
};

const calculateStreak = (history: ISessionRecord[]): number => {
  if (history.length === 0) return 0;

  const uniqueDays = history
    .map(session => parseISO(session.date))
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

const calculateTotalMinutes = (history: ISessionRecord[]): number => {
  const totalSeconds = history.reduce((acc, session) => acc + session.sessionDuration, 0);
  return Math.floor(totalSeconds / 60);
};

export const useSessionHistory = () => {
  const [history, setHistory] = useState<ISessionRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    const storedHistory = getStoredHistory();
    setHistory(storedHistory);
    setStreak(calculateStreak(storedHistory));
    setTotalMinutes(calculateTotalMinutes(storedHistory));
  }, []);

  const saveSession = useCallback((newSession: Omit<ISessionRecord, 'date'>) => {
    setHistory(prevHistory => {
      const sessionWithDate = { ...newSession, date: new Date().toISOString() };
      const updatedHistory = [...prevHistory, sessionWithDate];
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        setStreak(calculateStreak(updatedHistory));
        setTotalMinutes(calculateTotalMinutes(updatedHistory));
      } catch (error) {
        console.error('Error saving session to localStorage:', error);
      }
      return updatedHistory;
    });
  }, []);

  return { history, streak, totalMinutes, saveSession };
};
