import { useId } from 'react';

const BODY = 'M50 8C24 8 12 28 12 52v48q8-8 15 0t14 0q9-8 18 0t14 0q7-8 15 0V52C88 28 76 8 50 8Z';

export default function Ghost({ def, size = 120, silhouette = false }) {
  const gid = 'g' + useId().replace(/:/g, '');
  const c = def.color;
  const fill = silhouette ? '#1f1a3a' : `url(#${gid})`;
  return (
    <div className="ghost" style={{ width: size, height: size * 1.2, '--glow': silhouette ? 'transparent' : c }}>
      <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-hidden="true">
        <defs>
          <radialGradient id={gid} cx="40%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor={c} stopOpacity="0.92" />
            <stop offset="100%" stopColor={c} stopOpacity="0.5" />
          </radialGradient>
        </defs>
        {!silhouette && (
          <>
            <ellipse cx="12" cy="64" rx="6" ry="11" transform="rotate(-28 12 64)" fill={fill} />
            <ellipse cx="88" cy="64" rx="6" ry="11" transform="rotate(28 88 64)" fill={fill} />
          </>
        )}
        <path d={BODY} fill={fill} stroke={silhouette ? '#3b3466' : 'rgba(255,255,255,.6)'} strokeWidth="1.5" />
        {silhouette ? (
          <text x="50" y="68" textAnchor="middle" fontSize="32" fontWeight="800" fill="#5b5290">?</text>
        ) : (
          <>
            <ellipse cx="38" cy="50" rx="6.5" ry="8.5" fill="#1a1033" />
            <ellipse cx="62" cy="50" rx="6.5" ry="8.5" fill="#1a1033" />
            <circle cx="40" cy="47" r="2.2" fill="#fff" />
            <circle cx="64" cy="47" r="2.2" fill="#fff" />
            <ellipse cx="50" cy="69" rx="5" ry="6.5" fill="#1a1033" />
            <circle cx="27" cy="62" r="4.5" fill="#ff8fb1" opacity="0.55" />
            <circle cx="73" cy="62" r="4.5" fill="#ff8fb1" opacity="0.55" />
          </>
        )}
      </svg>
      {!silhouette && <span className="ghost-prop" style={{ fontSize: size * 0.3 }}>{def.prop}</span>}
    </div>
  );
}
