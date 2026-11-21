import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@/lib/browser-storage';
import type { Session } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import i18n from '@/i18n';
import { GuestDraftMigrationPrompt } from './GuestDraftMigrationPrompt';
import { RequireAuthProvider } from './SignInSheet';

export type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'member' | 'admin';
  locale: string | null;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  ready: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<unknown>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('skochko.locale').then((locale) => {
      if (locale === 'mk' || locale === 'en') i18n.changeLanguage(locale);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const { data: profile = null, refetch: refreshProfile } = useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, role, locale')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  useEffect(() => {
    if (profile?.locale === 'mk' || profile?.locale === 'en') {
      i18n.changeLanguage(profile.locale);
      AsyncStorage.setItem('skochko.locale', profile.locale).catch(() => {});
    }
  }, [profile?.locale]);

  const value: AuthState = {
    session,
    profile: userId ? profile : null,
    isAdmin: profile?.role === 'admin',
    ready,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      <RequireAuthProvider signedIn={!!session}>
        {children}
        <GuestDraftMigrationPrompt session={session} />
      </RequireAuthProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
