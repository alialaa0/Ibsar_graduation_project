import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, Search } from 'lucide-react';

export default function Landing() {
  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-glow/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-glow/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center space-y-16 max-w-5xl mx-auto py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <div className="w-2.5 h-2.5 rounded-full bg-glow animate-pulse shadow-[0_0_10px_#38BDF8]" />
              <span className="text-[10px] font-black text-white/50">AI Eye Disease Detection</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black leading-[1.1] text-white">
              Better Diagnostics.<br/>
              <span className="text-glow">Faster Insights.</span>
            </h1>
            
            <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
              IBSAR helps detect retinal diseases quickly and accurately using advanced AI analysis.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-lg">
              Start Scan <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/reports" className="btn-secondary text-lg">
              Learn More
            </Link>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
            {[
              { title: "Accurate Results", desc: "Highly reliable detection using advanced technology.", icon: Zap },
              { title: "Fast Scans", desc: "Get your results in just a few seconds.", icon: Shield },
              { title: "Easy History", desc: "Keep track of all your previous scans easily.", icon: Search },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 group hover:glow-border transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-glow/20 group-hover:border-glow/30 transition-all">
                  <f.icon className="w-6 h-6 text-glow" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom Meta Info */}
          <div className="mt-24 flex flex-wrap justify-center gap-12 text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-[10px] font-medium">System Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              <span className="text-[10px] font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
              <span className="text-[10px] font-medium">Cloud Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
