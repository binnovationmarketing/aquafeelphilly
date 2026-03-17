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
    <div style={{
      position: 'fixed', inset: 0,
      background: '#020d1a',
      color: '#fff',
      overflow: 'hidden',
      zIndex: 100,
      fontFamily: "'Montserrat', 'Inter', sans-serif",
    }}>
      {/* Particle network */}
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
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: '2.5rem' }}
        >
          <AquaFeelLogo width="260px" variant="white" />
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,174,239,0.1)',
            border: '1px solid rgba(0,174,239,0.25)',
            borderRadius: '9999px',
            padding: '0.35rem 1rem',
            fontSize: '0.65rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#00AEEF',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}>
            🌊 Water Solutions Intelligence Platform
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.75rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff 0%, #bae6fd 50%, #64748b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Aquafeel Solutions<br />
            <span style={{ background: 'linear-gradient(90deg, #00AEEF, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Tech
            </span>
          </h1>

          <p style={{ color: '#64748b', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', fontWeight: 400, maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Sales intelligence, hierarchy management & real-time analytics — all in one platform.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ marginBottom: '3rem' }}
        >
          <button
            onClick={onEnter}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: '#fff',
              color: '#020d1a',
              border: 'none',
              borderRadius: '9999px',
              padding: '1rem 2rem',
              fontSize: '0.85rem',
              fontWeight: 900,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#00AEEF';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 60px rgba(0,174,239,0.5)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#fff';
              (e.currentTarget as HTMLButtonElement).style.color = '#020d1a';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(255,255,255,0.2)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            Access Platform
            <div style={{
              background: '#020d1a',
              color: '#fff',
              borderRadius: '9999px',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
            }}>
              <ChevronRight size={18} />
            </div>
          </button>
        </motion.div>

        {/* Stats + Features side by side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          width: '100%',
          maxWidth: '900px',
        }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <StatCard value="8,790" label="System Value ($)" delay={1.0} />
            <StatCard value="$3K" label="Top Commission" delay={1.1} />
            <StatCard value="10+" label="Career Levels" delay={1.2} />
            <StatCard value="24/7" label="Real-time Sync" delay={1.3} />
          </div>

          {/* Features list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
            <Feature icon={BarChart2} title="Commission Intelligence" desc="Differential bonuses calculated automatically across your entire hierarchy." delay={1.1} />
            <Feature icon={Users} title="Team Hierarchy" desc="Analyst Jr → Embaixador — track every level's performance in real time." delay={1.25} />
            <Feature icon={ShieldCheck} title="Secure Access" desc="Role-based access, session protection, and auto-logout after inactivity." delay={1.4} />
            <Feature icon={Award} title="Progress Tracking" desc="Know exactly how many sales to your next promotion." delay={1.55} />
          </div>
        </div>

        {/* Footer badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          style={{
            position: 'absolute', bottom: '1.5rem',
            display: 'flex', gap: '2rem', alignItems: 'center',
          }}
        >
          {[
            { icon: ShieldCheck, label: 'Secure Access' },
            { icon: Globe, label: 'Global Scale' },
            { icon: Zap, label: 'Real-time Data' },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', color: '#334155' }}>
              <item.icon size={20} color="rgba(0,174,239,0.4)" />
              <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</span>
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
