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
    
    // Fetch profile with exponential backoff retry to handle background trigger delay
    let profile = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        profile = data;
        break;
      }
      
      if (error && error.code === 'PGRST116' && retries < maxRetries) {
        // Profile not found yet, wait and retry
        console.log(`Profile not found (retry ${retries + 1}/${maxRetries}), waiting...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (retries + 1)));
        retries++;
        continue;
      }
      
      if (error && error.code === 'PGRST116') {
        // Still not found after retries, try creating it
        console.log('Profile missing after retries, attempting manual creation...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email,
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error manually creating profile:', createError);
        } else {
          profile = newProfile;
        }
        break;
      } else if (error) {
        console.error('Error fetching profile:', error);
        break;
      }
      break;
    }

    set({ user, profile, session, initialized: true });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },
}));
