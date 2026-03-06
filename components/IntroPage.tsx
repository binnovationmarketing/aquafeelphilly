import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';

export const IntroPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <div className="fixed inset-0 bg-[#020d1a] text-white overflow-hidden z-[100]">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-aqua-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-12"
        >
          <AquaFeelLogo width="300px" variant="white" className="drop-shadow-[0_0_50px_rgba(0,174,239,0.5)]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
            AQUAFEEL SOLUTIONS <br />
            <span className="text-aqua-400">TECH</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
            Advanced Water Analytics & Sales Intelligence Platform
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <button
            onClick={onEnter}
            className="group relative px-8 py-4 bg-white text-[#020d1a] rounded-full font-black text-lg tracking-widest uppercase flex items-center gap-4 hover:bg-aqua-400 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(0,174,239,0.6)] hover:scale-105"
          >
            Access Platform
            <div className="bg-[#020d1a] text-white p-2 rounded-full group-hover:bg-white group-hover:text-[#020d1a] transition-colors">
              <ChevronRight size={20} />
            </div>
          </button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-12 w-full max-w-4xl grid grid-cols-3 gap-4 px-4"
        >
          {[
            { icon: ShieldCheck, label: "Secure Access" },
            { icon: Globe, label: "Global Scale" },
            { icon: Zap, label: "Real-time Data" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 text-slate-500">
              <item.icon size={24} className="text-aqua-500/50" />
              <span className="text-[10px] uppercase tracking-widest font-bold">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
