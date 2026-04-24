import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    stagesProgress: [],
    issueSeverity: [],
    topicsStatus: []
  });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      // Fetch data for reports (Real implementation would use more complex queries or views)
      const [stages, issues, topics] = await Promise.all([
        supabase.from('stages').select('stage_type, topics(progress_pct)'),
        supabase.from('issues').select('severity, status'),
        supabase.from('topics').select('status')
      ]);

      // Calculate Chart Data
      const stagesData = stages.data?.map((s: any) => ({
        name: s.stage_type.replace('_', ' '),
        progress: s.topics.length > 0 
          ? Math.round(s.topics.reduce((acc: number, t: any) => acc + (t.progress_pct || 0), 0) / s.topics.length)
          : 0
      })) || [];

      const issueData = [
        { name: 'Critical', value: issues.data?.filter(i => i.severity === 'critical' && i.status !== 'resolved').length || 0 },
        { name: 'High', value: issues.data?.filter(i => i.severity === 'high' && i.status !== 'resolved').length || 0 },
        { name: 'Medium', value: issues.data?.filter(i => i.severity === 'medium' && i.status !== 'resolved').length || 0 },
        { name: 'Low', value: issues.data?.filter(i => i.severity === 'low' && i.status !== 'resolved').length || 0 },
      ];

      setStats({
        stagesProgress: stagesData,
        issueSeverity: issueData,
        topicsStatus: topics.data || []
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6'];

  if (loading) return <div className="p-20 text-center">Crunching engineering data...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-white">Performance Intelligence</h1>
        <p className="text-slate-500 mt-1">Holistic visibility across all hardware engineering lifecycles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={TrendingUp} label="Avg Stage Health" value="72%" sub="Across 12 Projects" color="text-indigo-400" />
        <MetricCard icon={AlertCircle} label="Active Blockers" value="14" sub="3 Critical Priority" color="text-red-400" />
        <MetricCard icon={Clock} label="Approval Aging" value="2.4d" sub="-0.5d from last week" color="text-amber-400" />
        <MetricCard icon={CheckCircle2} label="Finalized Ideas" value="156" sub="+24 this month" color="text-green-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stage Progress Bar Chart */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Cross-Project Stage Progress
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stagesProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => v.split(' ')[0]} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }} 
                />
                <Bar 
                  dataKey="progress" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Severity Pie Chart */}
        <div className="glass-card p-8">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Open Issues by Severity
          </h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.issueSeverity}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.issueSeverity.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(10, 10, 15, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pr-8">
               {stats.issueSeverity.map((item: any, idx: number) => (
                 <div key={item.name} className="flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                   <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{item.name}</span>
                   <span className="text-xs font-black text-zinc-200">{item.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="glass-card p-6 border-l-4 border-l-indigo-600/50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl bg-white/5", color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
        <h4 className="text-3xl font-black">{value}</h4>
        <p className="text-xs text-zinc-600 font-medium">{sub}</p>
      </div>
    </motion.div>
  );
}
