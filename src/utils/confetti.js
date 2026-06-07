const CONFETTI_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#A66CFF',
  '#FF8C42',
  '#45B7D1',
  '#ffffff',
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function launchConfetti(durationMs = 3500) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1100;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let animationId;
  let particles = [];
  const startTime = performance.now();

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  resize();
  window.addEventListener('resize', resize);

  const createBurst = (x, y, count) => {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x,
        y,
        width: randomBetween(6, 12),
        height: randomBetween(4, 9),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: randomBetween(0, 360),
        rotationSpeed: randomBetween(-12, 12),
        velocityX: randomBetween(-9, 9),
        velocityY: randomBetween(-14, -4),
        gravity: randomBetween(0.18, 0.32),
        opacity: 1,
        decay: randomBetween(0.008, 0.018),
      });
    }
  };

  createBurst(window.innerWidth * 0.5, window.innerHeight * 0.35, 120);
  setTimeout(() => createBurst(window.innerWidth * 0.3, window.innerHeight * 0.3, 50), 200);
  setTimeout(() => createBurst(window.innerWidth * 0.7, window.innerHeight * 0.3, 50), 400);

  const animate = (now) => {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter((p) => p.opacity > 0.05 && p.y < canvas.height + 40);

    particles.forEach((p) => {
      p.velocityY += p.gravity;
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.rotation += p.rotationSpeed;
      p.velocityX *= 0.99;
      p.opacity -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(p.opacity, 0);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    });

    if (elapsed < durationMs || particles.length > 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      cleanup();
    }
  };

  const cleanup = () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };

  animationId = requestAnimationFrame(animate);

  return cleanup;
}
