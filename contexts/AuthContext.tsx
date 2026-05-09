import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Full role hierarchy — ordered from highest to lowest authority
export type AnalystRole =
  | 'admin'
  | 'ambassador'
  | 'master'
  | 'director_sr'
  | 'director_jr'
  | 'manager_sr'
  | 'manager_jr'
  | 'mentor_sr'
  | 'mentor_jr'
  | 'analyst_sr'
  | 'analyst_jr'
  | 'analyst'; // legacy fallback

// Mentor and below → analyst dashboard. Manager and above → manager dashboard.
export const MANAGER_ROLES: AnalystRole[] = [
  'admin',
  'ambassador',
  'master',
  'director_sr',
  'director_jr',
  'manager_sr',
  'manager_jr',
];

export const ROLE_LABELS: Record<AnalystRole, string> = {
  admin:       'Admin',
  ambassador:  'Embaixador',
  master:      'Master',
  director_sr: 'Diretor Sênior',
  director_jr: 'Diretor Jr.',
  manager_sr:  'Gerente Sênior',
  manager_jr:  'Gerente Jr.',
  mentor_sr:   'Mentor Sênior',
  mentor_jr:   'Mentor Jr.',
  analyst_sr:  'Analista Sênior',
  analyst_jr:  'Analista Jr.',
  analyst:     'Analista',
};

export interface AnalystProfile {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  aquafeel_email: string | null;
  role: AnalystRole;
  avatar_url: string | null;
  sales_goal: number;
  active: boolean;
  pending_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  manager_name: string | null;
  director_name: string | null;
  ambassador_name: string | null;
  office: string | null;
  division: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: AnalystProfile | null;
  loading: boolean;
  isManager: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AnalystProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('analysts')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 = 0 rows found → user is authenticated but has no profile.
      // Fix: Auto-create a default profile instead of kicking them out (Ghost Logout bug)
      if (error.code === 'PGRST116') {
        console.warn('No analyst profile found for user. Auto-creating default profile...');
        
        // We get the current session to extract the email
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const userEmail = currentSession?.user?.email || `user-${userId.substring(0, 5)}@aquafeel.com`;
        
        const { error: insertError } = await supabase
          .from('analysts')
          .insert({
            id: userId,
            email: userEmail,
            first_name: 'Novo',
            last_name: 'Analista',
            role: 'analyst',
            sales_goal: 100000,
            active: true,
            pending_approval: false,
            aquafeel_email: userEmail
          });

        if (insertError) {
          console.error('Failed to auto-create profile:', insertError);
          // Only sign out if we literally cannot create the profile due to DB errors
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          return false;
        }

        // Retry fetching the profile now that it exists
        const { data: newProfile } = await supabase.from('analysts').select('*').eq('id', userId).single();
        if (newProfile) {
          setProfile(newProfile as AnalystProfile);
          return true;
        }
      }
      console.error('Error fetching analyst profile:', error);
      return false;
    }
    if (data) setProfile(data as AnalystProfile);
    return true;
  };

  useEffect(() => {
    // Safety net — never hang longer than 1.5s before showing UI
    const timeout = setTimeout(() => setLoading(false), 1500);

    // onAuthStateChange fires INITIAL_SESSION immediately with the persisted
    // session from localStorage (when persistSession:true). No separate
    // getSession() call needed — that was causing a double DB round-trip.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Skip analyst profile fetch for client users (they have user_type: 'client' in metadata)
          const userType = session.user.user_metadata?.user_type;
          if (userType !== 'client') {
            try { await fetchProfile(session.user.id); } catch (_) {}
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        clearTimeout(timeout);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // 30-min inactivity auto-logout
  useEffect(() => {
    if (!user) return;
    let timer = setTimeout(() => signOut(), INACTIVITY_MS);
    const reset = () => { clearTimeout(timer); timer = setTimeout(() => signOut(), INACTIVITY_MS); };
    ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(e => window.removeEventListener(e, reset));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signOut = async () => {
    setProfile(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
    // Clear session from sessionStorage (new default) + legacy localStorage
    sessionStorage.removeItem('aq_session');
    localStorage.removeItem('aq_session');
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const isManager = MANAGER_ROLES.includes(profile?.role as AnalystRole);
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, isManager, isAdmin, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
