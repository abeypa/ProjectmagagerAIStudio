import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityLog } from '../types';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  CheckCircle, 
  AlertCircle, 
  FileUp, 
  MessageSquare, 
  RefreshCcw,
  User,
  ArrowRight
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface ActivityFeedProps {
  projectId: string;
  limit?: number;
}

export function ActivityFeed({ projectId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, actor:profiles(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error) setActivities(data as ActivityLog[]);
      setLoading(false);
    }
    fetchActivity();

    // Setup Realtime subscription
    const channel = supabase
      .channel(`project-activity-${projectId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_log',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        // Since we need joined actor data, we'll re-fetch for simplicity
        fetchActivity();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, limit]);

  if (loading) return <div className="space-y-4">
    {[1,2,3].map(i => <div key={i} className="h-16 w-full animate-pulse bg-white/5 rounded-xl" />)}
  </div>;

  if (activities.length === 0) return (
    <div className="glass-card p-12 text-center text-slate-500 border-dashed">
      No recent activity recorded for this project.
    </div>
  );

  return (
    <div className="space-y-6 relative">
      <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-white/5" />
      {activities.map((activity, idx) => (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          key={activity.id} 
          className="flex gap-6 relative z-10 items-start"
        >
          <ActivityDot action={activity.action} />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-tight">
              <span className="font-bold text-white">{activity.actor?.full_name || 'System'}</span>
              {' '}
              <span className="text-slate-400">{activity.action.replace('_', ' ')}</span>
              {' '}
              {activity.metadata?.title && <span className="text-indigo-400 italic">"{activity.metadata.title}"</span>}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                {activity.entity_type || 'Project'} • {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ActivityDot({ action }: { action: string }) {
  let color = 'bg-slate-600';
  if (action.includes('created')) color = 'bg-green-500';
  if (action.includes('finalized') || action.includes('approved') || action.includes('completed')) color = 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]';
  if (action.includes('issue')) color = 'bg-rose-500';
  if (action.includes('file')) color = 'bg-cyan-500';
  
  return <div className={cn("w-3.5 h-3.5 mt-1 rounded-full flex-shrink-0 border-4 border-background", color)} />;
}
