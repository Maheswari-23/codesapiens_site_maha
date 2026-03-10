import { useRef, useState, useCallback } from 'react';

/**
 * useSpotlightCard
 * Tracks cursor position within a card for:
 * 1. Spotlight radial glow at cursor (200px circle, #6366f112)
 * 2. 3D tilt up to maxTilt degrees
 * 3. Border reveal on hover
 *
 * Usage:
 *   const { ref, spotlightStyle, tiltStyle, isHovered, onMouseMove, onMouseLeave } = useSpotlightCard();
 *   <motion.div ref={ref} style={tiltStyle} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
 *     <div style={spotlightStyle} />   ← absolute overlay inside card
 *     ...card content...
 *   </motion.div>
 */
export function useSpotlightCard(maxTilt = 8) {
  const ref = useRef(null);
  const [spot, setSpot] = useState({ x: 0, y: 0, visible: false });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = x / rect.width  - 0.5;   // -0.5 → 0.5
    const relY = y / rect.height - 0.5;

    setSpot({ x, y, visible: true });
    setTilt({
      rx: -(relY * maxTilt * 2),
      ry:  (relX * maxTilt * 2),
    });
    setHovered(true);
  }, [maxTilt]);

  const onMouseLeave = useCallback(() => {
    setSpot(s => ({ ...s, visible: false }));
    setTilt({ rx: 0, ry: 0 });
    setHovered(false);
  }, []);

  const spotlightStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: spot.visible
      ? `radial-gradient(circle 200px at ${spot.x}px ${spot.y}px, #6366f112, transparent)`
      : 'none',
    pointerEvents: 'none',
    zIndex: 1,
    transition: 'opacity 200ms ease',
    opacity: spot.visible ? 1 : 0,
  };

  const tiltStyle = {
    rotateX: tilt.rx,
    rotateY: tilt.ry,
    transformPerspective: 1000,
    transition: hovered
      ? 'none'
      : 'rotateX 400ms cubic-bezier(.03,.98,.52,.99), rotateY 400ms cubic-bezier(.03,.98,.52,.99)',
  };

  return { ref, spotlightStyle, tiltStyle, isHovered: hovered, onMouseMove, onMouseLeave };
}
