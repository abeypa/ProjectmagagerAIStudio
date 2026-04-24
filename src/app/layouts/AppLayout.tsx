import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  User
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Projects', path: '/' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Admin', path: '/admin', adminOnly: true },
];

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:relative z-40 h-full bg-black/20 backdrop-blur-xl border-r border-white/10 transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20",
          !isSidebarOpen && "md:block hidden"
        )}
      >
        <div className="h-full flex flex-col p-4">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-white italic text-xl">F</span>
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-xl tracking-tight"
              >
                Forge PM
              </motion.span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              if (item.adminOnly && !profile?.is_admin) return null;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                    isActive 
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User & Sign Out */}
          <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/10">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="avatar" />
                ) : (
                  <User className="w-4 h-4 text-zinc-400" />
                )}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {profile?.full_name || profile?.email}
                  </span>
                  <span className="text-xs text-zinc-500 truncate lowercase">
                    {profile?.department || 'Member'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-20 border-b border-white/5 bg-black/10 backdrop-blur-xl flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-white/5 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative md:w-96 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search projects, tasks, issues..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full relative">
              <Bell className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
