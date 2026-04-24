import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Box, 
  Zap, 
  Cpu, 
  ShoppingCart, 
  Factory,
  ChevronRight,
  AlertCircle,
  FileText,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { Stage, StageType } from '../types';
import { cn } from '../lib/utils';

interface StagePanelProps {
  stage: Stage;
  projectId: string;
  key?: React.Key;
}

const stageConfigs: Record<StageType, { icon: any, color: string, label: string, theme: string }> = {
  '3d_design': { 
    icon: Box, 
    color: 'bg-violet-500', 
    label: '3D Design',
    theme: 'text-violet-400 border-violet-500/20 bg-violet-500/5'
  },
  'electrical_design': { 
    icon: Zap, 
    color: 'bg-yellow-500', 
    label: 'Electrical',
    theme: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
  },
  'software': { 
    icon: Cpu, 
    color: 'bg-cyan-500', 
    label: 'Software',
    theme: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'
  },
  'purchase': { 
    icon: ShoppingCart, 
    color: 'bg-orange-500', 
    label: 'Purchase',
    theme: 'text-orange-400 border-orange-500/20 bg-orange-500/5'
  },
  'manufacturing': { 
    icon: Factory, 
    color: 'bg-green-500', 
    label: 'Manufacturing',
    theme: 'text-green-400 border-green-500/20 bg-green-500/5'
  }
};

export function StagePanel({ stage, projectId }: StagePanelProps) {
  const config = stageConfigs[stage.stage_type];
  const progress = stage.progress_pct || 0;

  return (
    <Link to={`/projects/${projectId}/stages/${stage.id}`}>
      <motion.div 
        whileHover={{ y: -4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
        className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col h-full hover:bg-white/[0.08] transition-all"
      >
        <div className="flex justify-between items-start mb-6">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-opacity-20", config.color.replace('bg-', 'bg-') + '/20', config.theme.split(' ')[0])}>
            <config.icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 border border-slate-700/50 rounded uppercase">
            STAGE 0{stage.order_index}
          </span>
        </div>

        <div>
          <h4 className="text-white font-bold text-lg leading-tight">{config.label}</h4>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{config.label} Phase</p>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 font-bold">{progress}% Progress</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={cn("h-full transition-all duration-1000", config.color)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
           <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
             <span className={cn("w-1.5 h-1.5 rounded-full", (stage.open_issue_count || 0) > 0 ? "bg-rose-500" : "bg-slate-600")} />
             {stage.open_issue_count || 0} Issues
           </div>
           <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
             <span className={cn("w-1.5 h-1.5 rounded-full", (stage.file_count || 0) > 0 ? "bg-emerald-500" : "bg-slate-600")} />
             {stage.file_count || 0} Files
           </div>
        </div>
      </motion.div>
    </Link>
  );
}

function StatLine({ icon: Icon, count, label, active, color }: { icon: any, count?: number, label: string, active?: boolean | number, color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5", active ? color : "text-zinc-500")} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</span>
      </div>
      <span className={cn("text-xs font-medium", active ? "text-zinc-200" : "text-zinc-500")}>
        {count || 0}
      </span>
    </div>
  );
}
