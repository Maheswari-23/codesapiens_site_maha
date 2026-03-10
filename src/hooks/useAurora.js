import { useEffect, useRef } from 'react';

/**
 * useAurora
 * Renders a canvas aurora effect with:
 * - 3 blobs: indigo, purple, aqua (new design system colors)
 * - Gaussian blur via filter, slow sin drift, mouse attraction
 * - Dot grid that brightens near cursor
 * - 8 floating code tokens drifting upward
 */
export function useAurora(canvasRef) {
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Blobs config ──────────────────────────────────────────────────────────
    const BLOBS = [
      { color: '#6366f1', size: 600, ox: 0.18, oy: 0.22, speed: 0.00028, phase: 0    },
      { color: '#a855f7', size: 400, ox: 0.78, oy: 0.20, speed: 0.00035, phase: 1.5  },
      { color: '#22d3ee', size: 300, ox: 0.50, oy: 0.80, speed: 0.00022, phase: 3.0  },
    ];

    // ── Code tokens ───────────────────────────────────────────────────────────
    const TOKEN_STRINGS = ['const', '=>', '{}', '</>', 'async', 'null', '[]', 'fn'];
    const tokens = TOKEN_STRINGS.map((str, i) => ({
      str,
      x:     0.1 + (i / TOKEN_STRINGS.length) * 0.82,
      y:     0.2 + Math.random() * 0.6,
      speed: 0.00030 + Math.random() * 0.00050,
      drift: (Math.random() - 0.5) * 0.00012,
      alpha: 0.06 + Math.random() * 0.04,
    }));

    // ── Dot grid ──────────────────────────────────────────────────────────────
    const DOT_SPACING = 32;

    const t0 = performance.now();

    const draw = (now) => {
      rafRef.current = requestAnimationFrame(draw);
      const t  = now - t0;
      const W  = canvas.width;
      const H  = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, W, H);

      // ── Dot grid ───────────────────────────────────────────────────────────
      const cols = Math.ceil(W / DOT_SPACING) + 1;
      const rows = Math.ceil(H / DOT_SPACING) + 1;
      const mxPx = mx * W;
      const myPx = my * H;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dx = c * DOT_SPACING - mxPx;
          const dy = r * DOT_SPACING - myPx;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const bright = dist < 80 ? 0.12 + (1 - dist/80) * 0.08 : 0.03;
          ctx.fillStyle = `rgba(255,255,255,${bright})`;
          ctx.beginPath();
          ctx.arc(c * DOT_SPACING, r * DOT_SPACING, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Aurora blobs ──────────────────────────────────────────────────────
      BLOBS.forEach(blob => {
        // Slow sin drift ±80px
        const driftX = Math.sin(t * blob.speed + blob.phase) * 80;
        const driftY = Math.cos(t * blob.speed * 0.7 + blob.phase) * 60;
        // Subtle mouse attraction: 15px toward cursor
        const attractX = (mx - blob.ox) * 15;
        const attractY = (my - blob.oy) * 15;

        const bx = blob.ox * W + driftX + attractX;
        const by = blob.oy * H + driftY + attractY;
        const r  = blob.size / 2;

        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        grad.addColorStop(0, blob.color + '1f'); // opacity ~0.12
        grad.addColorStop(1, blob.color + '00');
        ctx.filter = 'blur(60px)';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = 'none';
      });

      // ── Floating code tokens ───────────────────────────────────────────────
      ctx.font = '13px "JetBrains Mono", monospace';
      tokens.forEach(tok => {
        tok.y -= tok.speed;
        tok.x += tok.drift;
        if (tok.y < -0.05) { tok.y = 1.08; tok.x = 0.05 + Math.random() * 0.9; }
        if (tok.x < 0 || tok.x > 1) tok.drift *= -1;

        ctx.fillStyle = `rgba(255,255,255,${tok.alpha})`;
        ctx.fillText(tok.str, tok.x * W, tok.y * H);
      });
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [canvasRef]);
}
