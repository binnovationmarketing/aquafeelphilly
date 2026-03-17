import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Full role hierarchy — ordered from highest to lowest authority
export type AnalystRole =
  | 'admin'
  | 'ambassador'
  | 'director_sr'
  | 'director_jr'
  | 'manager_sr'
  | 'manager_jr'
  | 'analyst';

export const MANAGER_ROLES: AnalystRole[] = [
  'admin',
  'ambassador',
  'director_sr',
  'director_jr',
  'manager_sr',
  'manager_jr',
];

export const ROLE_LABELS: Record<AnalystRole, string> = {
  admin:       'Admin',
  ambassador:  'Embaixador',
  director_sr: 'Diretor Sênior',
  director_jr: 'Diretor Jr.',
  manager_sr:  'Gerente Sênior',
  manager_jr:  'Gerente Jr.',
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
      // Sign them out cleanly instead of hanging on a blank dashboard.
      if (error.code === 'PGRST116') {
        console.warn('No analyst profile found for user — signing out.');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return false;
      }
      console.error('Error fetching analyst profile:', error);
      return false;
    }
    if (data) setProfile(data as AnalystProfile);
    return true;
  };

  useEffect(() => {
    // Safety net — never hang longer than 3s (down from 6s)
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try { await fetchProfile(session.user.id); } catch (_) {}
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try { await fetchProfile(session.user.id); } catch (_) {}
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setProfile(null);
    await supabase.auth.signOut();
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
