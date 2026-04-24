import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { StageFile } from '../types';
import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Upload, 
  Search,
  ExternalLink,
  MoreVertical,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatBytes, formatDate } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

import { useParams } from 'react-router-dom';

interface FilesGalleryProps {
  stageId?: string;
}

export default function FilesGallery({ stageId: propsStageId }: FilesGalleryProps) {
  const { stageId: urlStageId } = useParams<{ stageId: string }>();
  const stageId = propsStageId || urlStageId;
  
  if (!stageId) return <div className="p-20 text-center text-zinc-500 uppercase tracking-widest font-black text-xs">Invalid Stage ID Context</div>;

  const [files, setFiles] = useState<StageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuthStore();

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stage_files')
      .select('*, uploader:profiles(*)')
      .eq('stage_id', stageId)
      .order('uploaded_at', { ascending: false });
    
    if (!error) setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, [stageId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Max 50MB.');
      return;
    }

    try {
      setUploading(true);
      // In a real app, we'd get project_id first
      const { data: stageInfo } = await supabase.from('stages').select('project_id').eq('id', stageId).single();
      if (!stageInfo) throw new Error('Stage not found');

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `project-files/${stageInfo.project_id}/${stageId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project_files') // Ensure this bucket exists in Supabase
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project_files')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('stage_files')
        .insert([{
          stage_id: stageId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size_bytes: file.size,
          uploaded_by: profile?.id
        }]);

      if (dbError) throw dbError;

      toast.success('File uploaded successfully');
      fetchFiles();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Upload failed. Ensure Supabase Storage is configured.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Stage Repository</h2>
        <div className="flex items-center gap-3">
          <label className={cn(
            "btn-solid flex items-center gap-2 cursor-pointer h-10 px-4",
            uploading && "opacity-50 cursor-not-allowed"
          )}>
            {uploading ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span className="text-xs font-bold uppercase tracking-widest">{uploading ? 'Uploading...' : 'Upload File'}</span>
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card aspect-square animate-pulse" />
          ))
        ) : files.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 border border-dashed border-white/5 rounded-3xl">
            <Plus className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">No files documented yet</p>
          </div>
        ) : (
          files.map(file => (
            <FileCard key={file.id} file={file} />
          ))
        )}
      </div>
    </div>
  );
}

function FileCard({ file }: { file: StageFile, key?: React.Key }) {
  const isImage = file.file_type?.startsWith('image/');

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="glass-card group overflow-hidden flex flex-col"
    >
      <div className="aspect-video relative bg-white/2 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img 
            src={file.file_url} 
            alt={file.file_name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
        ) : (
          <FileIcon type={file.file_name.split('.').pop() || ''} />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <a 
              href={file.file_url} 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button className="p-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all">
              <Download className="w-4 h-4" />
            </button>
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-xs font-bold text-zinc-300 truncate" title={file.file_name}>
          {file.file_name}
        </h4>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-black uppercase text-zinc-600 tracking-tighter">
            {formatBytes(file.file_size_bytes || 0)}
          </span>
          <span className="text-[9px] font-black uppercase text-zinc-600 tracking-tighter">
            {formatDate(file.uploaded_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function FileIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (['pdf'].includes(t)) return <FileText className="w-10 h-10 text-red-500/40" />;
  if (['step', 'stp', 'dxf', 'dwg'].includes(t)) return <div className="text-2xl font-black text-indigo-500/40 italic">3D</div>;
  if (['zip', 'rar', '7z'].includes(t)) return <div className="text-2xl font-black text-amber-500/40">ZIP</div>;
  return <File className="w-10 h-10 text-zinc-500/40" />;
}

function RefreshCcw({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
  );
}
