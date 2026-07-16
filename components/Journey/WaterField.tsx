/**
 * WaterField — a full-screen canvas that renders the immersive backdrop.
 * The scene "clears" as the user scrolls: contaminated amber haze at the top
 * gradually resolves into luminous cyan clarity by the end of the journey.
 *
 * Driven by a progress ref (0..1) so it never triggers React re-renders,
 * and it self-throttles / degrades on weak devices and reduced-motion.
 */
import { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  hue: number;
  a: number;
  drift: number;
};

export function WaterField({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);

    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = reduce ? 0 : isSmall ? 42 : 90;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.55 + 0.15),
      hue: Math.random(),
      a: Math.random() * 0.5 + 0.2,
      drift: Math.random() * Math.PI * 2,
    }));

    const onMouse = (e: MouseEvent) => {
      mouse.current.x = e.clientX / w;
      mouse.current.y = e.clientY / h;
    };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', resize);

    // lerp helper
    const mix = (a: number, b: number, t: number) => a + (b - a) * t;

    let raf = 0;
    let t = 0;
    let last = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 16.67, 2.2);
      last = now;
      t += dt;

      const p = Math.max(0, Math.min(1, progressRef.current));
      ctx.clearRect(0, 0, w, h);

      // --- gradient wash: amber/turbid (top) -> deep cyan clarity (bottom) ---
      const g = ctx.createLinearGradient(0, 0, 0, h);
      // top color shifts from murky teal-brown toward deep ocean blue as we purify
      const topR = Math.round(mix(46, 4, p));
      const topG = Math.round(mix(52, 20, p));
      const topB = Math.round(mix(40, 55, p));
      const botR = Math.round(mix(8, 6, p));
      const botG = Math.round(mix(24, 42, p));
      const botB = Math.round(mix(38, 78, p));
      g.addColorStop(0, `rgb(${topR},${topG},${topB})`);
      g.addColorStop(1, `rgb(${botR},${botG},${botB})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (reduce) return;

      // --- caustic light beams (get brighter with clarity) ---
      const beams = 3;
      for (let i = 0; i < beams; i++) {
        const bx = (w / (beams + 1)) * (i + 1) + Math.sin(t * 0.006 + i) * 120;
        const grad = ctx.createRadialGradient(bx, -100, 0, bx, h * 0.4, h * 0.9);
        const clarity = 0.04 + p * 0.1;
        grad.addColorStop(0, `rgba(125,249,255,${clarity})`);
        grad.addColorStop(1, 'rgba(125,249,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // --- particles: contamination (amber) resolving into clean bubbles ---
      const mx = mouse.current.x * w;
      const my = mouse.current.y * h;
      for (const q of particles) {
        q.drift += 0.01 * dt;
        q.x += (q.vx + Math.sin(q.drift) * 0.3) * dt;
        q.y += q.vy * dt;
        // gentle mouse repulsion for interactivity
        const dx = q.x - mx;
        const dy = q.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (14000 - d2) / 14000;
          q.x += (dx / Math.sqrt(d2 + 1)) * f * 1.4 * dt;
          q.y += (dy / Math.sqrt(d2 + 1)) * f * 1.4 * dt;
        }
        if (q.y < -10) {
          q.y = h + 10;
          q.x = Math.random() * w;
        }
        if (q.x < -10) q.x = w + 10;
        if (q.x > w + 10) q.x = -10;

        // color: amber contaminant -> cyan clean, based on progress + particle seed
        const clean = Math.min(1, p * 1.3 + q.hue * 0.35);
        const r = Math.round(mix(180, 125, clean));
        const gg = Math.round(mix(120, 232, clean));
        const b = Math.round(mix(60, 255, clean));
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${gg},${b},${q.a * (0.5 + clean * 0.5)})`;
        ctx.fill();
        // faint glow on clean bubbles
        if (clean > 0.6) {
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.r * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(125,249,255,${0.05 * clean})`;
          ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', resize);
    };
  }, [progressRef]);

  return <canvas ref={canvasRef} aria-hidden className="fixed inset-0 -z-10 h-full w-full" />;
}
