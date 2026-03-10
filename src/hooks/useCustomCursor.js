import { useEffect, useRef } from 'react';

/**
 * useCustomCursor
 * Professional cursor: 5px dot (snaps) + 32px ring (spring).
 * 6 trailing dots that only show while moving.
 * Detects: link / button / card / code / text / default states.
 */
export function useCustomCursor(containerRef) {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const trailRefs = useRef([]);

  useEffect(() => {
    // Skip on touch/mobile devices
    if (window.matchMedia('(hover: none)').matches) return;
    if (typeof window === 'undefined') return;

    const dot   = dotRef.current;
    const ring  = ringRef.current;
    const trails = trailRefs.current.filter(Boolean);

    let mx = -999, my = -999;
    let rx = -999, ry = -999;
    let raf;
    let isMoving = false;
    let stillTimer;

    // Store last N positions for trail
    const history = Array(6).fill({ x: -999, y: -999 });

    // Trail config: size and opacity for each dot
    const TRAIL = [
      { size: 4,   opacity: 0.50 },
      { size: 3,   opacity: 0.35 },
      { size: 2,   opacity: 0.25 },
      { size: 1.5, opacity: 0.15 },
      { size: 1,   opacity: 0.10 },
      { size: 0.5, opacity: 0.05 },
    ];

    const detectState = (el) => {
      if (!el) return 'default';
      const tag = el.tagName?.toLowerCase();
      const role = el.getAttribute?.('role');
      if (el.closest('a, [role="link"]')) return 'link';
      if (el.closest('button, [role="button"], input[type="submit"]')) return 'button';
      if (el.closest('[data-cursor="card"], .glass-card, .sponsor-card, .hof-card, .social-card, .community-card')) return 'card';
      if (el.closest('code, pre, .font-mono, [data-cursor="code"]')) return 'code';
      if (tag === 'p' || tag === 'span' || el.closest('p')) return 'text';
      return 'default';
    };

    const applyState = (state) => {
      if (!ring || !dot) return;
      switch (state) {
        case 'link':
          ring.style.width = '48px';
          ring.style.height = '48px';
          ring.style.borderColor = '#22d3ee';
          ring.style.backgroundColor = 'transparent';
          dot.style.opacity = '0';
          break;
        case 'button':
          ring.style.width = '56px';
          ring.style.height = '56px';
          ring.style.borderColor = '#a855f7';
          ring.style.backgroundColor = '#a855f720';
          dot.style.opacity = '0';
          break;
        case 'card':
          ring.style.width = '44px';
          ring.style.height = '44px';
          ring.style.borderColor = '#6366f1';
          ring.style.backgroundColor = '#6366f110';
          dot.style.opacity = '1';
          break;
        case 'code':
          ring.style.width = '32px';
          ring.style.height = '32px';
          ring.style.borderColor = '#10b981';
          ring.style.backgroundColor = 'transparent';
          dot.style.background = '#10b981';
          dot.style.opacity = '1';
          break;
        case 'text':
          ring.style.width = '20px';
          ring.style.height = '20px';
          ring.style.borderColor = '#6366f1';
          ring.style.backgroundColor = 'transparent';
          dot.style.opacity = '1';
          break;
        default:
          ring.style.width = '32px';
          ring.style.height = '32px';
          ring.style.borderColor = '#6366f1';
          ring.style.backgroundColor = 'transparent';
          dot.style.background = '#f1f5f9';
          dot.style.opacity = '1';
      }
    };

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      isMoving = true;
      trails.forEach(t => { t.style.opacity = '1'; });
      clearTimeout(stillTimer);
      stillTimer = setTimeout(() => {
        isMoving = false;
        trails.forEach(t => { t.style.opacity = '0'; });
      }, 120);
      applyState(detectState(e.target));
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!dot || !ring) return;

      // Dot snaps instantly
      dot.style.transform = `translate(${mx - 2.5}px, ${my - 2.5}px)`;

      // Ring lags with lerp
      rx = lerp(rx, mx, 0.14);
      ry = lerp(ry, my, 0.14);
      ring.style.transform = `translate(${rx - parseInt(ring.style.width||'32')/2}px, ${ry - parseInt(ring.style.height||'32')/2}px)`;

      // Shift history
      history.unshift({ x: mx, y: my });
      history.pop();

      // Position trails
      trails.forEach((t, i) => {
        const pos = history[i + 1] || history[history.length - 1];
        const { size, opacity } = TRAIL[i];
        t.style.transform = `translate(${pos.x - size/2}px, ${pos.y - size/2}px)`;
        t.style.width = `${size}px`;
        t.style.height = `${size}px`;
        if (isMoving) t.style.opacity = String(opacity);
      });
    };

    raf = requestAnimationFrame(animate);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return { dotRef, ringRef, trailRefs };
}
