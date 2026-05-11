import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, History, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Upload Scan', icon: Upload, path: '/dashboard/upload' },
    { name: 'History', icon: History, path: '/history' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside className="hidden lg:flex w-64 border-r border-white/5 bg-navy-dark h-screen sticky top-0 pt-24 flex flex-col justify-between pb-8">
      <div className="px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
              location.pathname === item.path 
                ? "bg-glow/10 text-glow" 
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-glow" : "text-white/40 group-hover:text-white")} />
            <span className="font-medium">{item.name}</span>
            {location.pathname === item.path && (
              <motion.div 
                layoutId="active-sidebar"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-glow shadow-[0_0_8px_rgba(56,189,248,0.8)]"
              />
            )}
          </Link>
        ))}
      </div>

      <div className="px-4">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
