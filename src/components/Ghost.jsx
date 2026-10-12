// Ảnh ma (nền trong suốt) — silhouette dùng cho ma chưa bắt trong Sổ Ma
export default function Ghost({ def, size = 120, silhouette = false }) {
  return (
    <img
      className={`ghost-img ${silhouette ? 'sil' : ''}`}
      src={def.img}
      alt={silhouette ? 'Ma chưa bắt' : 'Ma'}
      width={size}
      height={Math.round(size * def.ratio)}
      draggable={false}
      style={{ '--glow': def.glow }}
    />
  );
}
