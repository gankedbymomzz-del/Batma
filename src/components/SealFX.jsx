import { useMemo } from 'react';

// Hiệu ứng phong ấn thành công: loé sáng, vòng ấn chú, tia lửa, dấu triện "封印"
export default function SealFX({ x, y }) {
  const sparks = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    a: (i / 32) * 360 + Math.random() * 8,
    d: 70 + Math.random() * 150,
    s: 3 + Math.random() * 5,
    dl: Math.random() * 0.2,
  })), []);

  return (
    <div className="seal-fx" aria-hidden="true">
      <div className="seal-flash" style={{ '--x': `${x}px`, '--y': `${y}px` }} />
      <div className="seal-origin" style={{ left: x, top: y }}>
        <span className="seal-ring r1" />
        <span className="seal-ring r2" />
        <span className="seal-ring r3" />
        <svg className="seal-circle" viewBox="0 0 200 200">
          <defs>
            <path id="sealPath" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
          </defs>
          <circle cx="100" cy="100" r="92" fill="none" stroke="#ffd166" strokeWidth="2" />
          <circle cx="100" cy="100" r="64" fill="none" stroke="#ffd166" strokeWidth="1.5" strokeDasharray="4 6" />
          <text fill="#ffd166" fontSize="18" fontFamily="serif" letterSpacing="6">
            <textPath href="#sealPath">敕令 封魔 鎮邪 驅鬼 敕令 封魔 鎮邪 驅鬼</textPath>
          </text>
          <path d="M100 44 L148 128 L52 128 Z M100 156 L52 72 L148 72 Z" fill="none" stroke="#ff6b4a" strokeWidth="1.5" />
        </svg>
        {sparks.map((p, i) => (
          <i
            key={i}
            className="spark"
            style={{ '--a': `${p.a}deg`, '--d': `${p.d}px`, '--s': `${p.s}px`, animationDelay: `${p.dl}s` }}
          />
        ))}
      </div>
      <div className="seal-stamp"><span>封印</span></div>
    </div>
  );
}
