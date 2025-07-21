import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { User } from "../../types/blockchain";

export const useBaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If no profile exists, create one
        if (error.code === "PGRST116") {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({ id: userId, role: "user" })
            .select()
            .single();
          if (insertError) throw insertError;
          setProfile(newUser as User);
        } else {
          throw error;
        }
      } else {
        setProfile(data as User);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (session) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, [session]);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        ...profile,
        profile: {
          username: session.user.user_metadata?.username,
          name: session.user.user_metadata?.display_name,
          avatar: session.user.user_metadata?.avatar_url,
        },
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at,
      }
    : null;

  return {
    // Core auth state
    session,
    user,
    profile,
    loading,
    isAuthenticated: !!user,

    // Auth methods
    loginWithEmail,
    signUpWithEmail,
    logout,
    refreshProfile,
  };
};