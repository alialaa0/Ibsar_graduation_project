import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Activity, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const { user, signInWithGoogle } = useAuth();

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-md">
      <div className="w-full px-6 md:px-10 xl:px-14">
        <div className="flex items-center justify-between h-20 w-full">
          <Link to="/" className="flex items-center gap-4 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-glow/10 border border-glow/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-glow" />
            </div>
            <span className="text-2xl font-black text-white italic group-hover:text-glow transition-colors">IBSAR</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/dashboard" className="text-xs font-black text-white/40 hover:text-glow transition-colors">Analytics</Link>
            <Link to="/history" className="text-xs font-black text-white/40 hover:text-glow transition-colors">Archive</Link>
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white/20">Operator</p>
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{user.displayName || user.email}</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-glow/20 overflow-hidden bg-glow/10">
                  {user.photoURL ? (
                    <img src={user.photoURL || undefined} alt="User" className="w-full h-full object-cover" />
                  ) : (
                   <div className="w-full h-full flex items-center justify-center text-glow font-bold">
                     {user.email?.[0].toUpperCase()}
                   </div>
                  )}
                </div>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="btn-primary py-2 px-6 text-xs font-black rounded-xl"
              >
                Sign Up
              </button>
            )}
          </div>
          
          <div className="md:hidden">
             {user ? (
               <Link to="/profile" className="w-10 h-10 rounded-full border border-glow/20 overflow-hidden block">
                 <img src={user.photoURL || undefined} alt="User" className="w-full h-full object-cover" />
               </Link>
             ) : (
               <button onClick={signInWithGoogle} className="btn-primary py-2 px-4 text-[10px] font-black rounded-xl">
                 Login
               </button>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
}
