import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Plus, Search, Filter, Calendar, Users, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ProjectStatus } from '../types';

export default function ProjectsHome() {
  const { projects, loading, createProject } = useProjects();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.customer?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? p.status !== 'archived' : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const archivedProjects = projects.filter(p => p.status === 'archived');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Projects</h1>
          <p className="text-slate-500 mt-1">Manage and track your hardware engineering projects.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-solid flex items-center justify-center gap-2 h-11 px-6"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by project name or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input pl-12 h-11"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['all', 'active', 'on_hold', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                statusFilter === status 
                  ? "bg-indigo-600 text-white shadow-lg" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-medium">No projects found</h3>
          <p className="text-zinc-500 mt-2 max-w-xs mx-auto">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          <button 
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="mt-6 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Archived Section */}
      {archivedProjects.length > 0 && (
        <div className="pt-8 border-t border-white/5">
          <button 
            onClick={() => setIsArchivedOpen(!isArchivedOpen)}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
          >
            {isArchivedOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <span className="font-medium uppercase tracking-wider text-xs">Archived Projects ({archivedProjects.length})</span>
          </button>
          <AnimatePresence>
            {isArchivedOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {archivedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-8 bg-zinc-900 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">New Project</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <NewProjectForm onSubmit={async (data) => {
                await createProject(data);
                setIsModalOpen(false);
              }} onCancel={() => setIsModalOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}

function NewProjectForm({ onSubmit, onCancel }: { onSubmit: (data: any) => Promise<void>, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer: '',
    start_date: '',
    end_date: '',
    priority: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      // toast handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-zinc-400">Project Name</label>
          <input 
            required
            type="text" 
            className="w-full glass-input h-11"
            placeholder="e.g. NextGen Controller v2"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-zinc-400">Customer / Internal Client</label>
          <input 
            required
            type="text" 
            className="w-full glass-input h-11"
            placeholder="e.g. Tesla R&D"
            value={formData.customer}
            onChange={e => setFormData({...formData, customer: e.target.value})}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-zinc-400">Description</label>
          <textarea 
            rows={3}
            className="w-full glass-input py-3"
            placeholder="Overview of the project goals and scope..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Start Date</label>
          <input 
            type="date" 
            className="w-full glass-input h-11"
            value={formData.start_date}
            onChange={e => setFormData({...formData, start_date: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-400">Target End Date</label>
          <input 
            type="date" 
            className="w-full glass-input h-11"
            value={formData.end_date}
            onChange={e => setFormData({...formData, end_date: e.target.value})}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-zinc-400">Priority (0-10)</label>
          <input 
            type="range" 
            min="0" 
            max="10" 
            className="w-full accent-indigo-600"
            value={formData.priority}
            onChange={e => setFormData({...formData, priority: parseInt(e.target.value)})}
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Low</span>
            <span>Medium</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 btn-outline h-12"
        >
          Cancel
        </button>
        <button 
          disabled={isSubmitting}
          type="submit" 
          className="flex-1 btn-solid h-12 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Project</span>}
        </button>
      </div>
    </form>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
  );
}
