
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, try to get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Then, listen for any changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Clean up the subscription when the component unmounts
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
};
