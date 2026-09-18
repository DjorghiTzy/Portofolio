/* ============================================================
   Hero background: a 2D canvas particle field.

   Deliberately not WebGL/three.js — the effect needs a few hundred
   points and some line work, which canvas 2D does at 60fps for a
   fraction of the bytes, and it degrades to "nothing renders" rather
   than "black rectangle" if the context is unavailable.

   Interaction: points drift, link to nearby neighbours, push away
   from the pointer, and a click sends a ring of force outward.
   ============================================================ */
window.HeroScene = (function () {
  'use strict';

  const TAU = Math.PI * 2;

  function create(canvas) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1;
    let points = [];
    let waves = [];
    let raf = null;
    let running = false;
    let accent = { r: 16, g: 185, b: 129 };

    const pointer = { x: -9999, y: -9999, active: false };

    /* Density scales with area but stays inside a sane band so a 4K
       monitor does not end up drawing 2000 nodes. */
    function targetCount() {
      const area = w * h;
      return Math.max(40, Math.min(150, Math.round(area / 16000)));
    }

    function readAccent() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const hex = raw.match(/^#([0-9a-f]{6})$/i);
      if (hex) {
        const n = parseInt(hex[1], 16);
        accent = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
        return;
      }
      const rgb = raw.match(/rgba?\(([^)]+)\)/);
      if (rgb) {
        const [r, g, b] = rgb[1].split(',').map(Number);
        accent = { r, g, b };
      }
    }

    function seed() {
      const n = targetCount();
      points = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.7,
        /* Per-point phase keeps the twinkle from pulsing in lockstep. */
        phase: Math.random() * TAU
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function step(t) {
      ctx.clearRect(0, 0, w, h);
      const linkDist = Math.min(150, Math.max(90, w / 12));
      const { r, g, b } = accent;

      /* Advance click shockwaves and drop the spent ones. */
      waves = waves.filter((wv) => {
        wv.radius += 9;
        wv.life -= 0.02;
        return wv.life > 0;
      });

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;

        /* Wrap instead of bounce: no visible walls. */
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 26000 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = (1 - d / 161) * 0.55;
            p.vx += (dx / d) * push * 0.06;
            p.vy += (dy / d) * push * 0.06;
          }
        }

        for (const wv of waves) {
          const dx = p.x - wv.x;
          const dy = p.y - wv.y;
          const d = Math.hypot(dx, dy) || 0.01;
          /* Only points sitting on the expanding ring get shoved. */
          if (Math.abs(d - wv.radius) < 46) {
            p.vx += (dx / d) * 0.5 * wv.life;
            p.vy += (dy / d) * 0.5 * wv.life;
          }
        }

        /* Friction pulls velocity back to the idle drift speed. */
        p.vx *= 0.985;
        p.vy *= 0.985;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp < 0.04) {
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;
        }

        const twinkle = 0.55 + Math.sin(t / 900 + p.phase) * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fillStyle = `rgba(${r},${g},${b},${twinkle * 0.7})`;
        ctx.fill();
      }

      /* Links. O(n²) over ≤150 points is ~11k cheap comparisons. */
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], c = points[j];
          const dx = a.x - c.x, dy = a.y - c.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDist * linkDist) continue;
          const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.22;
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
        }
      }

      /* Pointer halo, drawn last so it reads on top of the mesh. */
      if (pointer.active) {
        const grad = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 130);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.10)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(pointer.x - 130, pointer.y - 130, 260, 260);
      }

      for (const wv of waves) {
        ctx.beginPath();
        ctx.arc(wv.x, wv.y, wv.radius, 0, TAU);
        ctx.strokeStyle = `rgba(${r},${g},${b},${wv.life * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    /* ---- wiring ---- */
    readAccent();
    resize();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 160);
    });

    const hero = canvas.parentElement;
    hero.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    });
    hero.addEventListener('pointerleave', () => { pointer.active = false; });
    hero.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      waves.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, radius: 0, life: 1 });
      if (waves.length > 4) waves.shift();
    });

    /* Do not burn frames on a hidden tab or a scrolled-past hero. */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (!reduced) start();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !document.hidden && !reduced) start();
          else stop();
        });
      }, { threshold: 0.02 }).observe(canvas);
    }

    if (reduced) {
      /* One static frame still gives the hero some texture. */
      raf = requestAnimationFrame((t) => { step(t); stop(); });
    } else {
      start();
    }

    canvas.classList.add('is-on');

    return { refreshAccent: readAccent, start, stop };
  }

  return { create };
})();
