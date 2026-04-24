import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, MemberRole } from '../types';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Settings2, 
  MoreVertical,
  Shield,
  Trash2,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setUsers(data as Profile[]);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    if (!error) {
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'}`);
      setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Access Control</h1>
          <p className="text-slate-500 mt-1">Manage organization members, security clearances, and system privileges.</p>
        </div>
        <button className="btn-solid flex items-center justify-center gap-2 h-11 px-6">
          <UserPlus className="w-5 h-5" />
          <span>Invite Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-6 border-b-2 border-b-indigo-500">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Total Personnel</h4>
            <div className="text-3xl font-black">{users.length}</div>
         </div>
         <div className="glass-card p-6 border-b-2 border-b-amber-500">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Admins</h4>
            <div className="text-3xl font-black">{users.filter(u => u.is_admin).length}</div>
         </div>
         <div className="glass-card p-6 border-b-2 border-b-cyan-500">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Departments</h4>
            <div className="text-3xl font-black">{new Set(users.map(u => u.department).filter(Boolean)).size}</div>
         </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/2 flex items-center gap-4">
           <Search className="w-4 h-4 text-zinc-500" />
           <input 
             type="text" 
             placeholder="Filter personnel by name, email, or unit..." 
             className="bg-transparent outline-none text-sm w-full"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/2">
              <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-500 font-bold">
                          {user.full_name?.[0] || user.email?.[0]}
                       </div>
                       <div className="flex flex-col">
                          <span className="font-bold text-zinc-200">{user.full_name || 'Personnel'}</span>
                          <span className="text-xs text-zinc-500">{user.email}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest group-hover:text-amber-400/50 transition-colors">
                      {user.department || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.is_admin ? (
                        <span className="bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5 shadow-lg shadow-amber-500/5">
                          <Shield className="w-3 h-3" />
                          Administrator
                        </span>
                      ) : (
                        <span className="bg-zinc-500/10 text-zinc-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-zinc-500/20">
                          Contributor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-500">{formatDate(user.created_at)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                        title={user.is_admin ? "Revoke Admin" : "Grant Admin"}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          user.is_admin ? "text-amber-500 hover:bg-amber-500/10" : "text-zinc-500 hover:bg-white/10"
                        )}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
