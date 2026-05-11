import { useAuth } from '@/context/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, Settings, ChevronRight, Camera } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h2 className="text-3xl font-bold font-display">Account Settings</h2>
        <p className="text-white/50">Manage your profile and platform preferences</p>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card glow-border p-6 text-center space-y-4">
             <div className="relative inline-block group">
                <div className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden bg-white/5 mx-auto">
                   {user.photoURL ? (
                    <img src={user.photoURL || undefined} alt={user.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-full h-full p-6 text-white/20" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-glow text-navy shadow-xl scale-0 group-hover:scale-100 transition-transform">
                   <Camera className="w-4 h-4" />
                </button>
             </div>
             <div>
                <h3 className="font-bold text-xl">{user.displayName}</h3>
                <p className="text-sm text-white/40">{user.email}</p>
             </div>
             <div className="pt-2">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-glow">Verified Clinician</span>
             </div>
          </div>

          <div className="glass-card overflow-hidden">
             {[
               { name: 'Security', icon: Shield },
               { name: 'Preferences', icon: Settings },
             ].map((item) => (
                <button key={item.name} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-sm font-medium border-b border-white/5 last:border-0 group">
                   <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-white/40 group-hover:text-glow mt-0.5" />
                      {item.name}
                   </div>
                   <ChevronRight className="w-4 h-4 text-white/20" />
                </button>
             ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
           <section className="glass-card p-8 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                 <User className="w-5 h-5 text-glow" /> Profile Information
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 ml-1">Full Name</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/80">
                     {user.displayName}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/40 ml-1">Email Address</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-white/80">
                     {user.email}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button className="btn-secondary text-sm">Update Information</button>
              </div>
           </section>

           <section className="glass-card p-8 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                 <Shield className="w-5 h-5 text-glow" /> Data & Privacy
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                   <div>
                      <p className="text-sm font-bold">Encrypted History</p>
                      <p className="text-xs text-white/40">All retinal scans are end-to-end encrypted</p>
                   </div>
                   <div className="w-10 h-5 bg-glow/20 rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-glow rounded-full shadow-glow-sm" />
                   </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                   <div>
                      <p className="text-sm font-bold">Research Contribution</p>
                      <p className="text-xs text-white/40">Contribute anonymized data to global AI models</p>
                   </div>
                   <div className="w-10 h-5 bg-white/10 rounded-full relative">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white/30 rounded-full" />
                   </div>
                </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
