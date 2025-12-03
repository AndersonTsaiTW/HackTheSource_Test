// scripts/bubbles.js
// Lightweight animator for crystal/translucent bubbles that bounce at screen edges
(function () {
  // fewer bubbles but better spaced to avoid excessive overlap
  const BUBBLE_COUNT = 10;
  const containerId = 'bubble-bg';

  function createBubbleEl() {
    const el = document.createElement('div');
    el.className = 'bubble';
    return el;
  }

  function pickPalette(isLight) {
    if (isLight) {
      return [
        // vivid green / mint — stronger alpha so visible on light backdrops
        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%), linear-gradient(135deg, rgba(34,197,94,0.40), rgba(74,222,128,0.28))',
        // bold purple — visible and pretty
        'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.9), transparent 45%), linear-gradient(135deg, rgba(99,102,241,0.36), rgba(168,85,247,0.28))',
        // teal / blue — stronger presence
        'radial-gradient(circle at 30% 35%, rgba(255,255,255,0.85), transparent 45%), linear-gradient(135deg, rgba(6,182,212,0.38), rgba(59,130,246,0.28))',
        // warm pink / coral
        'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.9), transparent 45%), linear-gradient(135deg, rgba(255,99,132,0.36), rgba(255,159,243,0.24))'
      ];
    }
    // dark theme — more natural / pastel, subtle and muted for a natural look
    return [
      // deep ocean teal
      'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.28), transparent 45%), linear-gradient(135deg, rgba(10,84,120,0.42), rgba(12,128,146,0.22))',
      // misty forest green
      'radial-gradient(circle at 28% 28%, rgba(255,255,255,0.22), transparent 45%), linear-gradient(135deg, rgba(34,110,72,0.38), rgba(71,135,88,0.22))',
      // warm sand / amber
      'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.20), transparent 45%), linear-gradient(135deg, rgba(206,143,69,0.38), rgba(230,186,110,0.22))',
      // soft mauve / dusk
      'radial-gradient(circle at 34% 26%, rgba(255,255,255,0.22), transparent 45%), linear-gradient(135deg, rgba(100,75,120,0.36), rgba(150,120,170,0.20))'
    ];
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function init() {
    const root = document.getElementById(containerId);
    if (!root) return;

    // determine theme at start and update on changes
    const isLight = document.body.classList.contains('light-mode') || window.matchMedia('(prefers-color-scheme: light)').matches;
    const palette = pickPalette(isLight);

    // keep state for each bubble
    const bubbles = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    function makeBubble(i) {
      const el = createBubbleEl();
      // size scaled to viewport — allow smaller bubbles on narrow screens
      const maxSide = Math.min(width, height) || Math.max(width, height);
      const minSize = Math.max(16, Math.round(maxSide * 0.05));
      const maxSize = Math.max(minSize + 32, Math.round(Math.min(maxSide * 0.22, 220)));
      let size = Math.round(rand(minSize, maxSize));

      // attempt a more uniform/sparse placement
      // build a set of candidate points across the viewport (grid + jitter) then pick the first that doesn't overlap
      const candidates = [];
      const gridCols = Math.max(3, Math.round(Math.sqrt(BUBBLE_COUNT) * 2));
      const gridRows = Math.max(3, Math.round(Math.sqrt(BUBBLE_COUNT) * 2));
      const xPad = Math.max(size / 2 + 8, width * 0.02);
      const yPad = Math.max(size / 2 + 8, height * 0.02);

      for (let gx = 0; gx < gridCols; gx++) {
        for (let gy = 0; gy < gridRows; gy++) {
          const fx = (gx + 0.5) / gridCols; // normalized [0,1]
          const fy = (gy + 0.5) / gridRows;
          // jitter slightly so positions don't look too regular
          const jitterX = rand(-0.15, 0.15) * (width / gridCols);
          const jitterY = rand(-0.15, 0.15) * (height / gridRows);
          const cx = Math.min(Math.max(xPad, fx * width + jitterX), width - xPad);
          const cy = Math.min(Math.max(yPad, fy * height + jitterY), height - yPad);
          candidates.push([cx, cy]);
        }
      }

      // shuffle candidates so placement order isn't consistent on reloads
      for (let k = candidates.length - 1; k > 0; k--) {
        const r = Math.floor(Math.random() * (k + 1));
        const tmp = candidates[k]; candidates[k] = candidates[r]; candidates[r] = tmp;
      }

      // avoid clustering near the top-left corner — define a small no-generate box there
      const avoidNx = Math.max(32, Math.round(width * 0.14));
      const avoidNy = Math.max(32, Math.round(height * 0.14));

      let x = null, y = null;
      const minSepFactor = 1.05; // a little extra space
      for (const [cx, cy] of candidates) {
        // prefer points not inside the top-left avoid zone
        if (cx < avoidNx && cy < avoidNy) continue;

        // check overlap against existing bubbles
        let ok = true;
        for (const other of bubbles) {
          const dx = cx - other.x;
          const dy = cy - other.y;
          const minDist = (size + other.size) * minSepFactor;
          if ((dx * dx + dy * dy) < (minDist * minDist)) { ok = false; break; }
        }
        if (ok) { x = cx; y = cy; break; }
      }

      // fallback to randomized attempts (but still avoid top-left) if grid candidates didn't fit
      if (x === null) {
        const maxAttempts = 300;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const tx = rand(size / 2, Math.max(width - size / 2, size));
          const ty = rand(size / 2, Math.max(height - size / 2, size));
          if (tx < avoidNx && ty < avoidNy) continue; // keep away from top-left cluster
          let okay = true;
          for (const other of bubbles) {
            const dx = tx - other.x;
            const dy = ty - other.y;
            const minDist = (size + other.size) * minSepFactor;
            if ((dx * dx + dy * dy) < (minDist * minDist)) { okay = false; break; }
          }
          if (okay) { x = tx; y = ty; break; }
          // shrink occasionally to help fit
          if (attempt % 10 === 0 && size > minSize + 2) size = Math.round(size * rand(0.92, 0.98));
        }
      }

      // worst-case fallback — random anywhere
      if (x === null) {
        x = rand(size / 2, Math.max(width - size / 2, size));
        y = rand(size / 2, Math.max(height - size / 2, size));
      }
      // faster average speed with more variation
      const speed = rand(0.6, 1.6);
      const maxSpeed = speed * rand(1.8, 3.2);
      const angle = rand(0, Math.PI * 2);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // style
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      // place using transform instead of left/top so we can reliably reposition
      el.style.left = '0px';
      el.style.top = '0px';
      const tx = Math.round(x - size / 2);
      const ty = Math.round(y - size / 2);
      el.style.transform = `translate(${tx}px, ${ty}px)`;
      el.style.background = palette[i % palette.length];
      el.style.border = '1px solid rgba(255,255,255,0.12)';
      el.style.opacity = String(rand(0.55, 0.95));

      // pulse a few
      if (Math.random() > 0.65) el.classList.add('pulse');

      root.appendChild(el);

      return { el, x, y, vx, vy, size, maxSpeed, burstCooldown: rand(300, 1200) };
    }

    for (let i = 0; i < BUBBLE_COUNT; i++) bubbles.push(makeBubble(i));

    // do a short relaxation to separate any remaining small overlaps on first paint
    for (let iter = 0; iter < 6; iter++) {
      for (let a = 0; a < bubbles.length; a++) {
        for (let b = a + 1; b < bubbles.length; b++) {
          const p = bubbles[a];
          const q = bubbles[b];
          const dx = p.x - q.x; const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          const minDist = (p.size / 2 + q.size / 2) * 1.02;
          if (distSq > 0 && distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.001;
            const overlap = (minDist - dist) / dist * 0.5;
            p.x += dx * overlap; p.y += dy * overlap;
            q.x -= dx * overlap; q.y -= dy * overlap;
          }
        }
      }
    }

    // update element transforms after relaxation
    bubbles.forEach(b => {
      const r = Math.round(b.size / 2);
      const tx = Math.round(b.x - r);
      const ty = Math.round(b.y - r);
      b.el.style.transform = `translate(${tx}px, ${ty}px)`;
    });

    // update on resize — scale positions so bubbles stay visible and continue moving freely
    window.addEventListener('resize', () => {
      const prevW = width, prevH = height;
      width = window.innerWidth; height = window.innerHeight;
      bubbles.forEach(b => {
        const r = b.size / 2;
        if (prevW && prevH) {
          const sx = width / prevW; const sy = height / prevH;
          b.x = Math.min(Math.max(b.x * sx, r), width - r);
          b.y = Math.min(Math.max(b.y * sy, r), height - r);
        } else {
          b.x = Math.min(Math.max(b.x, r), width - r);
          b.y = Math.min(Math.max(b.y, r), height - r);
        }
      });
    });

    // animation loop
    let last = performance.now();

    function step(now) {
      const dt = Math.min(50, now - last) / 16.6667; // normalize to approx. 60fps unit
      last = now;

      bubbles.forEach(b => {
        b.x += b.vx * dt * 1.2; // apply some multiplier
        b.y += b.vy * dt * 1.2;

        const r = b.size / 2;

        // bounce logic — keep them inside the viewport
        if (b.x - r <= 0) { b.x = r; b.vx *= -1; }
        if (b.x + r >= width) { b.x = width - r; b.vx *= -1; }
        if (b.y - r <= 0) { b.y = r; b.vy *= -1; }
        if (b.y + r >= height) { b.y = height - r; b.vy *= -1; }

        // small damping for smoother motion
        b.vx *= 0.9945; b.vy *= 0.9945;

        // random gusts / bursts — gives a lively, faster motion sometimes
        if (b.burstCooldown <= 0 && Math.random() > 0.86) {
          const burstX = rand(-0.6, 0.6) * rand(1.5, 3.6);
          const burstY = rand(-0.6, 0.6) * rand(1.5, 3.6);
          b.vx += burstX; b.vy += burstY;

          // clamp to maxSpeed to avoid runaway
          const speedNow = Math.hypot(b.vx, b.vy);
          if (speedNow > b.maxSpeed) {
            const s = b.maxSpeed / speedNow;
            b.vx *= s; b.vy *= s;
          }

          b.burstCooldown = rand(240, 900);
        }

        // occasional small noise so the motion stays organic (also helps prevent standstill)
        if (Math.random() > 0.98) {
          b.vx += rand(-0.08, 0.08);
          b.vy += rand(-0.08, 0.08);
        }

        // ensure bubble never becomes stationary — if below threshold, give a gentle nudge
        const speedNow = Math.hypot(b.vx, b.vy);
        const minMovingSpeed = Math.max(0.16, 0.08 + (80 / Math.max(b.size, 1)) * 0.002); // slightly scale by size
        if (speedNow < minMovingSpeed) {
          // push in a random direction, but keep under maxSpeed
          const nudgeX = rand(-minMovingSpeed * 1.5, minMovingSpeed * 1.5);
          const nudgeY = rand(-minMovingSpeed * 1.5, minMovingSpeed * 1.5);
          b.vx += nudgeX; b.vy += nudgeY;
          // clamp again to maxSpeed
          const capped = Math.hypot(b.vx, b.vy);
          if (capped > b.maxSpeed) {
            const s = b.maxSpeed / capped;
            b.vx *= s; b.vy *= s;
          }
        }
        b.burstCooldown -= dt * 16.6667;

        // simple pairwise collision separation so bubbles don't heavily overlap
        for (let j = 0; j < bubbles.length; j++) {
          if (b === bubbles[j]) continue;
          const o = bubbles[j];
          const dx_ = b.x - o.x;
          const dy_ = b.y - o.y;
          const distSq = dx_ * dx_ + dy_ * dy_;
          const minDist = (b.size / 2 + o.size / 2) * 0.9;
          if (distSq > 0 && distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.001;
            const overlap = (minDist - dist) / dist * 0.5; // push each half
            b.x += dx_ * overlap;
            b.y += dy_ * overlap;
            o.x -= dx_ * overlap;
            o.y -= dy_ * overlap;
          }
        }

        // apply transform
        const tx = Math.round(b.x - r);
        const ty = Math.round(b.y - r);
        const rotation = (b.x + b.y) % 360 * 0.03; // subtle rotation
        b.el.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotation}deg)`;
      });

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);

    // if theme toggles elsewhere, update palette
    const observer = new MutationObserver(() => {
      const nowLight = document.body.classList.contains('light-mode') || window.matchMedia('(prefers-color-scheme: light)').matches;
      const newPalette = pickPalette(nowLight);
      bubbles.forEach((b, i) => { b.el.style.background = newPalette[i % newPalette.length]; });
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
