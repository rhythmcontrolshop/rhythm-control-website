'use client'
import React, { useEffect, useRef, useState } from "react";

const DOT_SCALE = 1.2;
const ROWS = [
  { dotSize: 8,  gap: 5,  speed:  60,  scale: DOT_SCALE       },
  { dotSize: 13, gap: 7,  speed:  28,  scale: DOT_SCALE       },
  { dotSize: 18, gap: 7,  speed:   0,  scale: DOT_SCALE * 0.7 },
  { dotSize: 13, gap: 9,  speed: -28,  scale: DOT_SCALE       },
];
const ROW_HEIGHTS = [18, 18, 26, 18];
const HEIGHT = ROW_HEIGHTS.reduce((a, b) => a + b, 0);

export default function StrobeDots() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const offsetsRef  = useRef(ROWS.map(() => 0));
  const lastTimeRef = useRef<number | null>(null);
  const rafRef      = useRef<number | null>(null);
  const activeRef   = useRef(false);
  const [, forceRender] = useState(0);

  // ResizeObserver — update width
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    if (containerRef.current) {
      ro.observe(containerRef.current);
      setWidth(containerRef.current.offsetWidth);
    }
    return () => ro.disconnect();
  }, []);

  // IntersectionObserver — pause rAF when off-screen
  useEffect(() => {
    const start = () => {
      if (activeRef.current) return;
      activeRef.current = true;
      lastTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (!activeRef.current) return;
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const dt = (timestamp - lastTimeRef.current) / 1000;
        lastTimeRef.current = timestamp;

        ROWS.forEach((row, i) => {
          const unit = row.dotSize + row.gap;
          offsetsRef.current[i] = (offsetsRef.current[i] + row.speed * dt) % unit;
          if (offsetsRef.current[i] < 0) offsetsRef.current[i] += unit;
        });

        forceRender(t => t + 1);
        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    const stop = () => {
      activeRef.current = false;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? start() : stop() },
      { threshold: 0 }
    );

    if (containerRef.current) io.observe(containerRef.current);

    return () => { io.disconnect(); stop(); };
  }, []);

  const circles: React.JSX.Element[] = [];
  let y = 0;

  ROWS.forEach((row, i) => {
    const unit  = row.dotSize + row.gap;
    const r     = (row.dotSize / 2) * row.scale;
    const cy    = y + ROW_HEIGHTS[i] / 2;
    const offset  = offsetsRef.current[i];
    const startX  = (offset % unit) - unit;

    for (let x = startX; x < width + unit; x += unit) {
      const cx = x + row.dotSize / 2;
      if (cx + r < 0 || cx - r > width) continue;
      circles.push(
        <circle key={`${i}-${Math.round(x)}`} cx={cx} cy={cy} r={r} fill="white" />
      );
    }
    y += ROW_HEIGHTS[i];
  });

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        backgroundColor: '#000000',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 0',
        borderTop: '2px solid #FFFFFF',
      }}
    >
      <svg width={width} height={HEIGHT} style={{ display: "block", overflow: "hidden" }}>
        <rect width={width} height={HEIGHT} fill="black" />
        {circles}
      </svg>
    </div>
  );
}
