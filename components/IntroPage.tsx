import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ShieldCheck, Zap, Globe, BarChart2, Users, Award } from 'lucide-react';
import AquaFeelLogo from './AquaFeelLogo';

/* ─── Particle Canvas ─── */
const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,174,239,${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      }
      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dist = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,174,239,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} />;
};

/* ─── Stat Card ─── */
const StatCard: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '1rem',
      padding: '1.25rem 1.5rem',
      textAlign: 'center',
      backdropFilter: 'blur(12px)',
    }}
  >
    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#00AEEF', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.4rem' }}>{label}</div>
  </motion.div>
);

/* ─── Feature Row ─── */
const Feature: React.FC<{ icon: React.FC<any>; title: string; desc: string; delay: number }> = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.6 }}
    style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
  >
    <div style={{
      flexShrink: 0,
      width: '2.5rem', height: '2.5rem',
      borderRadius: '0.75rem',
      background: 'rgba(0,174,239,0.1)',
      border: '1px solid rgba(0,174,239,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color="#00AEEF" />
    </div>
    <div>
      <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.85rem' }}>{title}</div>
      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.15rem', lineHeight: 1.4 }}>{desc}</div>
    </div>
  </motion.div>
);

/* ─── Main Component ─── */
export const IntroPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <div className="relative min-h-screen bg-[#020d1a] text-white overflow-x-hidden w-full font-montserrat flex flex-col items-center py-12 md:py-20 lg:py-24">
      <ParticleCanvas />

      {/* Glow blobs */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '50%', height: '50%',
          background: 'rgba(37,99,235,0.15)',
          borderRadius: '50%', filter: 'blur(120px)',
          animation: 'pulse 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '50%', height: '50%',
          background: 'rgba(0,174,239,0.12)',
          borderRadius: '50%', filter: 'blur(120px)',
          animation: 'pulse 8s ease-in-out infinite',
          animationDelay: '3s',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl px-4 md:px-8 mx-auto flex flex-col items-center justify-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 md:mb-12"
        >
          <AquaFeelLogo width="min(260px, 60vw)" variant="white" />
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center mb-10 md:mb-16 px-4"
        >
          <div className="inline-block bg-aqua-500/10 border border-aqua-500/20 rounded-full px-4 py-1.5 text-[10px] md:text-xs font-black tracking-widest text-emerald-400 uppercase mb-6">
            🌊 Water Solutions Intelligence Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-tight tracking-tighter mb-4 bg-gradient-to-b from-white via-white to-slate-500 bg-clip-text text-transparent">
            Aquafeel Philly<br />
            <span className="bg-gradient-to-r from-aqua-400 to-blue-500 bg-clip-text text-transparent">
              Tech
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base lg:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            Sales intelligence, hierarchy management & real-time analytics — all in one platform.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mb-12 md:mb-20"
        >
          <button
            onClick={onEnter}
            className="flex items-center gap-4 bg-white text-slate-950 px-8 py-4 rounded-full text-xs md:text-sm font-black tracking-widest uppercase cursor-pointer shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:bg-aqua-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300 group"
          >
            Access Platform
            <div className="bg-slate-950 text-white rounded-full p-2 flex items-center justify-center group-hover:bg-white group-hover:text-aqua-600 transition-colors">
              <ChevronRight size={18} />
            </div>
          </button>
        </motion.div>

        {/* Stats + Features side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 w-full max-w-5xl">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 order-2 lg:order-1">
            <StatCard value="8,790?" label="System Value ($)" delay={1.0} />
            <StatCard value="$1.5K até ?" label="Top Commission" delay={1.1} />
            <StatCard value="10+" label="Career Levels" delay={1.2} />
            <StatCard value="24/7" label="Real-time Sync" delay={1.3} />
          </div>

          {/* Features list */}
          <div className="flex flex-col gap-6 md:gap-8 justify-center order-1 lg:order-2 px-4">
            <Feature icon={BarChart2} title="Commission Intelligence" desc="Differential bonuses calculated automatically across your entire hierarchy." delay={1.1} />
            <Feature icon={Users} title="Team Hierarchy" desc="Analyst Jr → Embaixador — track every level's performance." delay={1.25} />
            <Feature icon={ShieldCheck} title="Secure Access" desc="Role-based access, session protection, and auto-logout." delay={1.4} />
            <Feature icon={Award} title="Progress Tracking" desc="Know exactly how many sales to your next promotion." delay={1.55} />
          </div>
        </div>

        {/* Footer badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-16 mb-8 lg:mt-24 flex flex-wrap justify-center gap-8 md:gap-12"
        >
          {[
            { icon: ShieldCheck, label: 'Secure Access' },
            { icon: Globe, label: 'Global Scale' },
            { icon: Zap, label: 'Real-time Data' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 text-slate-500">
              <item.icon size={24} className="opacity-40 text-aqua-400" />
              <span className="text-[9px] md:text-[10px] font-black tracking-widest uppercase">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};
