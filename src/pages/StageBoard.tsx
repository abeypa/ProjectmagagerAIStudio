import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTopics } from '../hooks/useTopics';
import { useStages } from '../hooks/useStages';
import { 
  ChevronRight, 
  Plus, 
  Layers, 
  FileText, 
  AlertCircle, 
  ArrowLeft,
  LayoutDashboard,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TopicRow } from '../components/TopicRow';
import TopicDetail from '../pages/TopicDetail';
import FilesGallery from '../pages/FilesGallery';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Stage } from '../types';

export default function StageBoard() {
  const { projectId, stageId } = useParams<{ projectId: string, stageId: string }>();
  const { topics, loading, addTopic, updateTopic } = useTopics(stageId!);
  const [stage, setStage] = useState<Stage | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'files' | 'issues'>('topics');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStage() {
      const { data } = await supabase
        .from('stages')
        .select('*')
        .eq('id', stageId)
        .single();
      setStage(data);
    }
    fetchStage();
  }, [stageId]);

  if (!stage) return null;

  return (
    <div className="h-full flex flex-col space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Link to="/" className="hover:text-zinc-300 flex items-center gap-1 transition-colors">
            <LayoutDashboard className="w-3 h-3" />
            Projects
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/projects/${projectId}`} className="hover:text-zinc-300 transition-colors uppercase truncate max-w-[150px]">Project Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300 uppercase">{stage.stage_type.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/projects/${projectId}`} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black tracking-tight capitalize">{stage.stage_type.replace('_', ' ')}</h1>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-solid flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Topic</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-2xl w-fit">
        <TabButton 
          active={activeTab === 'topics'} 
          onClick={() => setActiveTab('topics')} 
          icon={Layers} 
          label="Topics" 
          count={topics.length}
        />
        <TabButton 
          active={activeTab === 'files'} 
          onClick={() => setActiveTab('files')} 
          icon={FileText} 
          label="Files" 
        />
        <TabButton 
          active={activeTab === 'issues'} 
          onClick={() => setActiveTab('issues')} 
          icon={AlertCircle} 
          label="Issues" 
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-white/2 rounded-3xl border border-white/5 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'topics' && (
              <motion.div 
                key="topics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {topics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 text-center text-zinc-500 border border-dashed border-white/10 rounded-3xl">
                     <Layers className="w-12 h-12 mb-4 opacity-50 transition-all group-hover:scale-110" />
                     <p className="font-medium text-lg">No topics started in this stage.</p>
                     <p className="text-sm mt-1">Break down this stage into actionable work items.</p>
                     <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-6 text-indigo-400 font-bold uppercase tracking-widest text-xs hover:text-indigo-300"
                      >
                        + Create Your First Topic
                      </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topics.map((topic) => (
                      <TopicRow 
                        key={topic.id} 
                        topic={topic} 
                        onClick={() => setSelectedTopicId(topic.id)} 
                        isActive={selectedTopicId === topic.id}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'files' && (
              <motion.div 
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <FilesGallery stageId={stageId!} />
              </motion.div>
            )}

            {activeTab === 'issues' && (
              <motion.div key="issues" className="text-zinc-500 p-20 text-center">
                Stage-level issue tracking coming soon.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Topic Detail Drawer Overlay/Panel */}
        <AnimatePresence>
          {selectedTopicId && (
            <TopicDetail 
              topicId={selectedTopicId} 
              onClose={() => setSelectedTopicId(null)}
              onUpdate={() => {}}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Add Topic Modal Placeholder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
           <div className="glass-card p-8 w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6">Add New Topic</h2>
              <AddTopicForm 
                onCancel={() => setIsAddModalOpen(false)}
                onSubmit={async (data) => {
                  await addTopic(data);
                  setIsAddModalOpen(false);
                }}
              />
           </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2 rounded-xl transition-all",
        active ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
      {count !== undefined && (
        <span className={cn(
          "ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-black",
          active ? "bg-indigo-400/30" : "bg-white/5"
        )}>{count}</span>
      )}
    </button>
  );
}

function AddTopicForm({ onCancel, onSubmit }: any) {
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '' });
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Title</label>
        <input 
          className="w-full glass-input" 
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          placeholder="e.g. PCB Component Selection"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Description</label>
        <textarea 
          rows={3}
          className="w-full glass-input" 
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Detail the tasks to be completed..."
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Due Date</label>
        <input 
          type="date"
          className="w-full glass-input" 
          value={formData.due_date}
          onChange={e => setFormData({...formData, due_date: e.target.value})}
        />
      </div>
      <div className="flex gap-4 pt-4">
        <button onClick={onCancel} className="flex-1 btn-outline">Cancel</button>
        <button onClick={() => onSubmit(formData)} className="flex-1 btn-solid">Save Topic</button>
      </div>
    </div>
  );
}
