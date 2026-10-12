// Lá bùa giấy vàng — vật ném để phong ấn ma
export default function Talisman({ kind = 'paper' }) {
  const gold = kind === 'gold';
  const id = `tal-${kind}`;
  return (
    <svg viewBox="0 0 60 90" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={gold ? '#fff3b0' : '#fbf0cf'} />
          <stop offset="1" stopColor={gold ? '#f0a800' : '#e8c66a'} />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="54" height="84" rx="3" fill={`url(#${id})`} stroke={gold ? '#9a5a00' : '#a8461c'} strokeWidth="2" />
      <rect x="8" y="8" width="44" height="74" rx="1.5" fill="none" stroke="#c8302b" strokeWidth="1.4" />
      <circle cx="30" cy="17" r="3.2" fill="#c8302b" />
      <text x="30" y="43" textAnchor="middle" fontSize="22" fontWeight="700" fill="#c8302b" fontFamily="serif">封</text>
      <path d="M18 53Q30 47 42 53M20 61H40M30 53V79M22 71Q30 77 38 71" stroke="#c8302b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
