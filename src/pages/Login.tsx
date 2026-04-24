import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'ok' | 'failed'>('testing');
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) throw error;
        setConnectionStatus('ok');
      } catch (err) {
        console.error('Supabase connection test failed:', err);
        setConnectionStatus('failed');
      }
    };
    if (isSupabaseConfigured) {
      checkConnection();
    } else {
      setConnectionStatus('failed');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error('Supabase configuration missing (Settings > Secrets)');
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Registration successful! Please check your email.');
        setIsSignUp(false);
      } else if (isMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        toast.success('Magic link sent to your email!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success('Welcome back, Engineer.');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center</h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Authentication Required</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            connectionStatus === 'testing' ? "bg-amber-500 animate-pulse" :
            connectionStatus === 'ok' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
            "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
          )} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {connectionStatus === 'testing' ? 'Testing Link...' : 
             connectionStatus === 'ok' ? 'Link Secure' : 'Link Offline'}
          </span>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-500 font-black uppercase tracking-widest">Connection Required</h4>
            <p className="text-xs text-amber-500/70 leading-relaxed">
              Please configure <code className="bg-amber-500/20 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-amber-500/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in <b>Settings &gt; Secrets</b> to enable authentication.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-input pl-12 h-12"
              placeholder="name@company.com"
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-zinc-400">Password</label>
              <button 
                type="button" 
                className="text-xs text-indigo-400 hover:text-indigo-300"
                onClick={() => setIsMagicLink(true)}
              >
                Use magic link instead?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-12 h-12"
                placeholder="••••••••"
              />
            </div>
          </div>
        )}

        <button 
          disabled={loading}
          type="submit" 
          className="w-full btn-solid h-12 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{isSignUp ? 'Create Account' : isMagicLink ? 'Send Magic Link' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <div className="flex flex-col gap-3">
          {isMagicLink && !isSignUp && (
            <button 
              type="button"
              onClick={() => setIsMagicLink(false)}
              className="text-slate-500 text-xs hover:text-slate-300 transition-colors uppercase tracking-widest font-black"
            >
              Back to password login
            </button>
          )}

          {!isMagicLink && (
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors uppercase tracking-widest font-black"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          )}
        </div>
      </form>
      
      <div className="mt-8 pt-8 border-t border-white/5 text-center">
        <p className="text-sm text-zinc-500">
          Hardware Engineering Team? <span className="text-zinc-300 font-medium cursor-help" title="Contact your administrator for access">Request Access</span>
        </p>
      </div>
    </div>
  );
}
