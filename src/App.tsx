import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { AppRouter } from './app/Router';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { setSession, initialized } = useAuthStore();

  useEffect(() => {
    // Safety timeout for initialization
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.warn('Auth initialization timed out. Checking configuration...');
        setSession(null); // Force initialized state if it hangs
      }
    }, 5000);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
    }).catch(err => {
      console.error('Session check failed:', err);
      clearTimeout(timeout);
      setSession(null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [setSession, initialized]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <AppRouter />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'glass-card text-white border-white/10',
          style: {
            background: 'rgba(20, 20, 25, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
      />
    </>
  );
}
