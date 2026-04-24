import { Outlet } from 'react-router-dom';
import { motion } from 'motion/react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <span className="text-3xl font-bold text-white italic">F</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Forge PM</h1>
          <p className="text-zinc-500 mt-2">Hardware Engineering Management</p>
        </div>
        
        <Outlet />
      </motion.div>
    </div>
  );
}
