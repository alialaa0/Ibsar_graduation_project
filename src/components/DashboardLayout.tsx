import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Home, LayoutDashboard, History, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const mobileMenuItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Dash', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Archive', icon: History, path: '/history' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-navy relative">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 w-full px-2 sm:px-4 md:px-8 xl:px-12 2xl:px-20 pt-8 pb-24 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-dark/80 backdrop-blur-xl border-t border-white/5 px-2 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around">
          {mobileMenuItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all",
                location.pathname === item.path ? "text-glow" : "text-white/40"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
