import React, { useState } from 'react';
import { useMembers } from '../hooks/useMembers';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldAlert, 
  User, 
  Trash2, 
  Mail,
  Loader2
} from 'lucide-react';
import { MemberRole } from '../types';
import { cn, formatDate } from '../lib/utils';

interface ProjectMembersProps {
  projectId: string;
}

export function ProjectMembers({ projectId }: ProjectMembersProps) {
  const { members, loading, addMember, removeMember, updateMemberRole } = useMembers(projectId);
  const { profile } = useAuthStore();
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsAdding(true);
    await addMember(newEmail);
    setNewEmail('');
    setIsAdding(false);
  };

  const isOwner = members.find(m => m.user_id === profile?.id)?.role === 'owner' || profile?.is_admin;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwner && (
        <form onSubmit={handleAddMember} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="email" 
              placeholder="Enter member email..." 
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 outline-none transition-all"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isAdding}
            />
          </div>
          <button 
            type="submit" 
            disabled={isAdding || !newEmail}
            className="btn-solid h-11 px-6 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Invite</span>
          </button>
        </form>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 glass-card group transition-all hover:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold overflow-hidden">
                {member.profile?.avatar_url ? (
                  <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  member.profile?.full_name?.[0] || member.profile?.email?.[0] || '?'
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  {member.profile?.full_name || 'System Personnel'}
                  {member.user_id === profile?.id && (
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-widest text-zinc-400">You</span>
                  )}
                </span>
                <span className="text-xs text-zinc-500">{member.profile?.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <RoleBadge role={member.role} />
                {member.stage_assignment && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-2 py-0.5 bg-white/5 rounded border border-white/5">
                    {member.stage_assignment.replace('_', ' ')}
                  </span>
                )}
              </div>

              {isOwner && member.user_id !== profile?.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select 
                    className="bg-zinc-800 border border-white/10 rounded-lg text-[10px] h-8 px-2 outline-none focus:border-indigo-500"
                    value={member.role}
                    onChange={(e) => updateMemberRole(member.id, e.target.value as MemberRole)}
                  >
                    <option value="owner">Owner</option>
                    <option value="stage_lead">Stage Lead</option>
                    <option value="contributor">Contributor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button 
                    onClick={() => removeMember(member.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'owner':
      return (
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
          <ShieldAlert className="w-3 h-3" />
          Owner
        </span>
      );
    case 'stage_lead':
      return (
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">
          <Shield className="w-3 h-3" />
          Lead
        </span>
      );
    case 'contributor':
      return (
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded border border-white/10">
          <User className="w-3 h-3" />
          Staff
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded">
          Viewer
        </span>
      );
  }
}
