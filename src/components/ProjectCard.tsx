import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Users, AlertCircle, TrendingUp, MoreVertical } from 'lucide-react';
import { Project, StageType } from '../types';
import { cn, formatDate } from '../lib/utils';

interface ProjectCardProps {
  project: Project;
  key?: React.Key;
}

const stageColors: Record<StageType, string> = {
  '3d_design': 'bg-violet-500',
  'electrical_design': 'bg-yellow-500',
  'software': 'bg-cyan-500',
  'purchase': 'bg-orange-500',
  'manufacturing': 'bg-green-500'
};

export function ProjectCard({ project }: ProjectCardProps) {
  // Sort stages by order_index
  const sortedStages = [...(project.stages || [])].sort((a, b) => a.order_index - b.order_index);
  
  // Calculate overall progress across all stages
  const overallProgress = sortedStages.length > 0
    ? Math.round(sortedStages.reduce((acc, stage) => acc + (stage.progress_pct || 0), 0) / sortedStages.length)
    : 0;

  return (
    <Link to={`/projects/${project.id}`} className="group">
      <motion.div 
        whileHover={{ y: -4 }}
        className="glass-card glass-card-hover p-6 h-full flex flex-col"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                project.status === 'active' ? "bg-green-500/10 text-green-400" :
                project.status === 'on_hold' ? "bg-yellow-500/10 text-yellow-400" :
                "bg-zinc-500/10 text-zinc-400"
              )}>
                {project.status}
              </span>
              {project.priority > 7 && (
                <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  High
                </span>
              )}
            </div>
              <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{project.customer || 'Internal'}</p>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full text-slate-500">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
  
          <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">
            {project.description || "No description provided for this project."}
          </p>
  
          {/* Stage Health Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span>Engineering Coverage</span>
              <span className="text-indigo-400">{overallProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {sortedStages.map((stage) => (
                <div 
                  key={stage.id}
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    stageColors[stage.stage_type]
                  )}
                  style={{ 
                    width: `${100 / sortedStages.length}%`,
                    opacity: (stage.progress_pct || 0) / 100 + 0.1,
                  }}
                />
              ))}
              {sortedStages.length === 0 && (
                <div className="w-full bg-slate-800" />
              )}
            </div>
          </div>
  
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Blockers</span>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <AlertCircle className={cn("w-4 h-4", project.open_issues_count && project.open_issues_count > 0 ? "text-rose-400" : "text-slate-600")} />
                <span className="text-white font-bold">{project.open_issues_count || 0}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Personnel</span>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="w-4 h-4 text-slate-600" />
                <span className="text-white font-bold">{project.members_count || 1}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Target</span>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="truncate text-white font-bold">{formatDate(project.end_date)}</span>
              </div>
            </div>
          </div>
      </motion.div>
    </Link>
  );
}
