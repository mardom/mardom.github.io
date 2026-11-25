// Subtle Deep-Field Starfield & Gravitational Wake Canvas
(function () {
  function initStarfield() {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spectralPalette = ['#e2e8f0', '#bae6fd', '#7dd3fc', '#fde68a', '#ddd6fe'];

  let width = 0;
  let height = 0;
  let stars = [];
  let animId = null;
  let tick = 0;

  function buildStars() {
    const count = Math.min(180, Math.max(70, Math.floor((width * height) / 11500)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.45 + Math.random() * 1.45,
      vx: (Math.random() - 0.5) * 0.08,
      vy: 0.03 + Math.random() * 0.09,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.018,
      color: spectralPalette[Math.floor(Math.random() * spectralPalette.length)],
    }));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
    drawFrame();
  }

  function drawFrame() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.clearRect(0, 0, width, height);

    // Subtle cosmic wake arcs
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.06)' : 'rgba(0, 212, 255, 0.05)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const yBase = height * (0.25 + i * 0.28);
      const drift = Math.sin(tick * 0.004 + i) * 26;
      ctx.moveTo(-40, yBase + drift);
      ctx.quadraticCurveTo(width * 0.5, yBase - 65 - drift, width + 40, yBase + 35 + drift);
      ctx.stroke();
    }
    ctx.restore();

    for (const s of stars) {
      const twinkle = 0.42 + 0.58 * Math.sin(s.phase + tick * s.speed);
      ctx.globalAlpha = isLight ? twinkle * 0.25 : twinkle * 0.82;
      ctx.fillStyle = isLight ? '#0284c7' : s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (!prefersReducedMotion) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.y > height + 4) {
          s.y = -4;
          s.x = Math.random() * width;
        }
        if (s.x < -4) s.x = width + 4;
        if (s.x > width + 4) s.x = -4;
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (document.hidden || prefersReducedMotion) return;
    tick += 1;
    drawFrame();
    animId = window.requestAnimationFrame(loop);
  }

  function handleVisibility() {
    if (document.hidden) {
      if (animId) {
        window.cancelAnimationFrame(animId);
        animId = null;
      }
    } else if (!prefersReducedMotion && !animId) {
      loop();
    }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('themechange', drawFrame);

  resize();
  if (!prefersReducedMotion) {
    loop();
  }
  }

  window.MardomSite = window.MardomSite || {};
  window.MardomSite.initStarfield = initStarfield;
})();
