import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Send,
  Flag,
  User,
  MoreVertical,
  Plus,
  RefreshCcw,
  Clock,
  TrendingDown,
  TrendingUp,
  Circle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Topic, Idea, Approval, Issue, TopicStatus, IssueSeverity } from '../types';
import { cn, formatDate } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

import { useParams, useNavigate } from 'react-router-dom';

interface TopicDetailProps {
  topicId?: string;
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function TopicDetail({ topicId: propsTopicId, onClose, onUpdate }: TopicDetailProps) {
  const { topicId: urlTopicId } = useParams<{ topicId: string }>();
  const topicId = propsTopicId || urlTopicId;
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ideas' | 'approvals' | 'issues' | 'activity'>('ideas');
  const { profile } = useAuthStore();

  const fetchData = async () => {
    setLoading(true);
    const [tRes, iRes, aRes, issRes] = await Promise.all([
      supabase.from('topics').select('*, assignees:profiles(*)').eq('id', topicId).single(),
      supabase.from('ideas').select('*, author:profiles(*)').eq('topic_id', topicId).order('created_at', { ascending: false }),
      supabase.from('approvals').select('*, requester:profiles!approvals_requested_by_fkey(*), reviewer:profiles!approvals_reviewed_by_fkey(*)').eq('topic_id', topicId).order('requested_at', { ascending: false }),
      supabase.from('issues').select('*, reporter:profiles!issues_reported_by_fkey(*), assignee:profiles!issues_assigned_to_fkey(*)').eq('topic_id', topicId).order('created_at', { ascending: false })
    ]);

    if (!tRes.error) setTopic(tRes.data);
    if (!iRes.error) setIdeas(iRes.data);
    if (!aRes.error) setApprovals(aRes.data);
    if (!issRes.error) setIssues(issRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [topicId]);

  const updateProgress = async (val: number) => {
    const { error } = await supabase.from('topics').update({ progress_pct: val }).eq('id', topicId);
    if (!error) {
      toast.success('Progress updated');
      fetchData();
      onUpdate();
    }
  };

  const handleFinalizeIdea = async (ideaId: string) => {
    // Enforce: only one finalized idea
    try {
      await supabase.from('ideas').update({ is_finalized: false }).eq('topic_id', topicId);
      const { error } = await supabase.from('ideas').update({ is_finalized: true, finalized_at: new Date().toISOString() }).eq('id', ideaId);
      if (error) throw error;
      toast.success('Idea finalized');
      fetchData();
    } catch (err) {
      toast.error('Failed to finalize idea');
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  if (loading || !topic) return (
    <div className="w-[400px] lg:w-[500px] h-full border-l border-white/5 p-8 flex items-center justify-center">
       <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div 
      initial={{ x: 500, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 500, opacity: 0 }}
      className={cn(
        "h-full bg-zinc-900/50 backdrop-blur-2xl flex flex-col shadow-2xl relative z-20",
        propsTopicId ? "w-[400px] lg:w-[600px] border-l border-white/10" : "flex-1"
      )}
    >
      {/* Drawer Header */}
      <div className="p-6 border-b border-white/5 flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
             <StatusBadge status={topic.status} />
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Clock className="w-3 h-3" />
                Due {formatDate(topic.due_date)}
             </div>
          </div>
          <h2 className="text-2xl font-black tracking-tight">{topic.title}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{topic.description || 'No description provided.'}</p>
        </div>
        <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Section */}
      <div className="p-6 bg-white/2 border-b border-white/5 space-y-4">
        <div className="flex items-center justify-between">
           <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Execution Progress</span>
           <span className="text-sm font-black text-indigo-400">{topic.progress_pct}%</span>
        </div>
        <input 
          type="range" 
          value={topic.progress_pct} 
          onChange={(e) => updateProgress(parseInt(e.target.value))}
          className="w-full accent-indigo-500 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
          <span>Stalled</span>
          <span>In Progress</span>
          <span>Finalizing</span>
          <span>Released</span>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex border-b border-white/5 p-1 bg-black/20">
          <DetailTab active={activeTab === 'ideas'} onClick={() => setActiveTab('ideas')} icon={Lightbulb} label="Ideas" count={ideas.length} />
          <DetailTab active={activeTab === 'approvals'} onClick={() => setActiveTab('approvals')} icon={CheckCircle2} label="Approvals" count={approvals.length} />
          <DetailTab active={activeTab === 'issues'} onClick={() => setActiveTab('issues')} icon={AlertCircle} label="Issues" count={issues.length} />
          <DetailTab active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon={History} label="History" />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'ideas' && (
              <motion.div key="ideas" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Design Concepts</h3>
                  <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" /> New Idea
                  </button>
                </div>
                {ideas.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 border border-dashed border-white/5 rounded-2xl">
                    No ideas submitted yet.
                  </div>
                ) : (
                  ideas.map(idea => (
                    <div key={idea.id} className={cn(
                      "glass-card p-4 border border-white/5 relative",
                      idea.is_finalized && "border-green-500/30 bg-green-500/5 shadow-green-500/5"
                    )}>
                      {idea.is_finalized && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-zinc-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-green-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Finalized
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-200">{idea.title}</h4>
                          <p className="text-xs text-zinc-500 mt-1">{idea.description}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-black uppercase text-zinc-500">
                          {idea.author?.full_name?.[0] || 'U'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">
                          {new Date(idea.created_at).toLocaleDateString()}
                        </span>
                        {!idea.is_finalized && (
                          <button 
                            onClick={() => handleFinalizeIdea(idea.id)}
                            className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
                          >
                            Mark as Final
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === 'approvals' && (
              <motion.div key="approvals" className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Approval Workflow</h3>
                  <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300">
                    Request Verification
                  </button>
                </div>
                {approvals.map(approval => (
                  <div key={approval.id} className="glass-card p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                       <span className={cn(
                         "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                         approval.status === 'approved' ? "bg-green-400/10 text-green-400 border-green-400/20" :
                         approval.status === 'revision_required' ? "bg-red-400/10 text-red-400 border-red-400/20" :
                         "bg-amber-400/10 text-amber-400 border-amber-400/20"
                       )}>
                         {approval.status.replace('_', ' ')}
                       </span>
                       <span className="text-[10px] text-zinc-500 font-bold">{formatDate(approval.requested_at)}</span>
                    </div>
                    <h4 className="font-bold text-zinc-200">{approval.deliverable_label}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{approval.comment || 'No reviewer comments yet.'}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'issues' && (
              <motion.div key="issues" className="space-y-4">
                 <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Linked Issues</h3>
                  <button className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300">
                    Log Obstacle
                  </button>
                </div>
                {issues.map(issue => (
                  <div key={issue.id} className="glass-card p-4 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                       <SeverityBadge severity={issue.severity} />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{issue.status}</span>
                    </div>
                    <h4 className="font-bold text-zinc-200">{issue.title}</h4>
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-[8px] font-black text-zinc-600">
                             {issue.reporter?.full_name?.[0] || 'S'}
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500">{issue.reporter?.full_name || 'System'}</span>
                       </div>
                       <button className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-600">
                          <MoreVertical className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: TopicStatus }) {
  const configs: Record<TopicStatus, { icon: any, color: string, label: string }> = {
    not_started: { icon: Circle, color: 'text-zinc-500', label: 'Dormant' },
    in_progress: { icon: TrendingUp, color: 'text-amber-500', label: 'In Execution' },
    blocked: { icon: AlertCircle, color: 'text-red-500', label: 'Blocked' },
    completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Finished' }
  };
  const config = configs[status];
  return (
    <div className={cn("flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px]", config.color)}>
      <config.icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const colors: Record<IssueSeverity, string> = {
    low: 'text-zinc-500',
    medium: 'text-amber-500',
    high: 'text-orange-500',
    critical: 'text-red-500'
  };
  return (
    <div className={cn("flex items-center gap-1 text-[8px] font-black uppercase tracking-widest", colors[severity])}>
      <Flag className="w-2.5 h-2.5 fill-current" />
      {severity}
    </div>
  );
}

function DetailTab({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 flex flex-col items-center gap-2 transition-all relative border-b-2",
        active ? "border-indigo-500 text-zinc-200" : "border-transparent text-zinc-600 hover:text-zinc-400"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black",
          active ? "bg-indigo-600 text-white" : "bg-white/5 text-zinc-600"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
