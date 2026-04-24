import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  initialized: boolean;
  setSession: (session: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  initialized: false,
  setSession: async (session) => {
    if (!session) {
      set({ user: null, profile: null, session: null, initialized: true });
      return;
    }

    const user = session.user;
    
    // Fetch profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    }

    set({ user, profile, session, initialized: true });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },
}));
