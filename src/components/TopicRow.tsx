import React from 'react';
import { motion } from 'motion/react';
import { 
  Circle, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  User
} from 'lucide-react';
import { Topic, TopicStatus } from '../types';
import { cn, formatDate } from '../lib/utils';

interface TopicRowProps {
  topic: Topic;
  onClick: () => void;
  isActive: boolean;
  key?: React.Key;
}

const statusColors: Record<TopicStatus, string> = {
  not_started: 'text-zinc-500',
  in_progress: 'text-amber-500',
  blocked: 'text-red-500',
  completed: 'text-green-500'
};

export function TopicRow({ topic, onClick, isActive }: TopicRowProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.005, x: 2 }}
      onClick={onClick}
      className={cn(
        "glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer border border-white/5",
        isActive ? "bg-indigo-600/5 border-indigo-500/30 shadow-indigo-500/10" : "hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={cn("flex-shrink-0", statusColors[topic.status])}>
          {topic.status === 'completed' ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : topic.status === 'blocked' ? (
            <AlertCircle className="w-6 h-6" />
          ) : topic.status === 'in_progress' ? (
            <TrendingUp className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-zinc-200 truncate">{topic.title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <Clock className="w-3 h-3" />
              {topic.due_date ? formatDate(topic.due_date) : 'No due date'}
            </div>
            {topic.issues_count > 0 && (
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
                <AlertCircle className="w-3 h-3" />
                {topic.issues_count} Issues
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 px-4">
        {/* Progress */}
        <div className="hidden md:flex flex-col gap-1.5 w-32">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <span>Progress</span>
            <span className="text-zinc-300">{topic.progress_pct}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${topic.progress_pct}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                topic.status === 'completed' ? "bg-green-500" : "bg-indigo-500"
              )}
            />
          </div>
        </div>

        {/* Assignees */}
        <div className="flex -space-x-2">
          {topic.assignees && topic.assignees.length > 0 ? (
            topic.assignees.slice(0, 3).map((user) => (
              <div 
                key={user.id} 
                className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 overflow-hidden flex-shrink-0"
                title={user.full_name || user.email || ''}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="avatar" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500 capitalize">
                    {user.full_name?.[0] || user.email?.[0]}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-zinc-600">
              <User className="w-4 h-4" />
            </div>
          )}
          {topic.assignees && topic.assignees.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-500">
              +{topic.assignees.length - 3}
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-zinc-600 sm:block hidden" />
      </div>
    </motion.div>
  );
}
