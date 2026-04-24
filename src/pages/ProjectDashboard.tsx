import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStages } from '../hooks/useStages';
import { useProjects } from '../hooks/useProjects';
import { 
  Settings, 
  ChevronRight, 
  Users, 
  Calendar, 
  Building2, 
  Clock,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { StagePanel } from '../components/StagePanel';
import { ActivityFeed } from '../components/ActivityFeed';
import { ProjectMembers } from '../components/ProjectMembers';
import { cn, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

export default function ProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { stages, loading: stagesLoading } = useStages(projectId!);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'members'>('activity');

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;
      const { data, error } = await supabase
        .from('projects')
        .select('*, owner:profiles!projects_owner_id_fkey(*)')
        .eq('id', projectId)
        .single();
      
      if (!error) setProject(data);
      setLoading(false);
    }
    fetchProject();
  }, [projectId]);

  if (loading || stagesLoading) {
    return <div className="h-full flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>;
  }

  if (!project) return <div>Project not found</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
        <Link to="/" className="hover:text-zinc-300 flex items-center gap-1 transition-colors">
          <LayoutDashboard className="w-3 h-3" />
          Projects
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-zinc-300 transition-colors uppercase">{project.name}</span>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              project.status === 'active' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
            )}>
              {project.status}
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <Clock className="w-3 h-3" />
              Updated {formatDate(project.updated_at)}
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            {project.name}
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            {project.description || "The mission description for this project has not been defined yet."}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Customer</p>
            <h3 className="text-lg font-semibold text-white">{project.customer || 'NASA / JPL'}</h3>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Cycle Target</p>
            <h3 className="text-lg font-semibold text-white">{formatDate(project.end_date)}</h3>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Open Blockers</p>
            <h3 className="text-lg font-semibold text-rose-400">12 Reported</h3>
          </div>
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1 font-bold">Clearance Queue</p>
            <h3 className="text-lg font-semibold text-emerald-400">4 Pending</h3>
          </div>
        </div>
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map((stage) => (
          <StagePanel key={stage.id} stage={stage} projectId={projectId!} />
        ))}
      </div>

      {/* Secondary Content */}
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-8 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('activity')}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'activity' ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Mission Logs
            {activeTab === 'activity' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
          <button 
            onClick={() => setActiveTab('members')}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
              activeTab === 'members' ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Personnel
            {activeTab === 'members' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'activity' ? (
              <ActivityFeed projectId={projectId!} limit={20} />
            ) : (
              <ProjectMembers projectId={projectId!} />
            )}
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Mission Metrics</h2>
            <div className="glass-card p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Total Progress</span>
                  <span>{Math.round(stages.reduce((acc, s) => acc + (s.progress_pct || 0), 0) / stages.length)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${Math.round(stages.reduce((acc, s) => acc + (s.progress_pct || 0), 0) / (stages.length || 1))}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Blockers</p>
                  <p className="text-xl font-bold text-rose-400">{stages.reduce((acc, s) => acc + (s.open_issue_count || 0), 0)}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Files</p>
                  <p className="text-xl font-bold text-indigo-400">{stages.reduce((acc, s) => acc + (s.file_count || 0), 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-lg font-bold text-zinc-200">{value}</div>
    </div>
  );
}
