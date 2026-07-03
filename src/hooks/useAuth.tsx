import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  couple_id: string | null;
  role: "woman_with_endo" | "partner" | "moderator";
  display_name: string | null;
  email: string | null;
  language: string | null;
  onboarding_complete: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAnonymous: boolean;
  signInModerator: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetLocalAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as Profile | null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const ensureAnonymousSession = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous sign-in failed:", error);
      return null;
    }
    return data.session;
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
        }
      }
    );

    (async () => {
      const { data: { session: existing } } = await supabase.auth.getSession();
      let active = existing;
      if (!active) {
        active = await ensureAnonymousSession();
      }
      if (!mounted) return;
      setSession(active);
      setUser(active?.user ?? null);
      if (active?.user) {
        await fetchProfile(active.user.id);
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInModerator = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetLocalAccount = async () => {
    // Sign out current (anonymous) session, then bootstrap a fresh one.
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    const fresh = await ensureAnonymousSession();
    setSession(fresh);
    setUser(fresh?.user ?? null);
    if (fresh?.user) {
      await fetchProfile(fresh.user.id);
    }
    setLoading(false);
  };

  const isAnonymous = Boolean(user && (user as any).is_anonymous);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAnonymous,
        signInModerator,
        signOut,
        resetLocalAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
