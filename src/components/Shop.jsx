import { ITEMS, PACKS } from '../items.js';

// Tiệm vàng mã: mua pháp khí và bùa trước mỗi đêm
export default function Shop({ save, onBuy, onClose }) {
  const coins = save.coins || 0;
  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet shop" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Tiệm vàng mã</h2>
          <span className="coin-pill"><i className="coin" />{coins}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <p className="shop-sub">Pháp khí dùng được ngay giữa trận, mỗi món mang tối đa 3.</p>
        <ul className="shop-list">
          {Object.entries(ITEMS).map(([id, it]) => {
            const owned = save.items[id] || 0;
            const full = owned >= it.max;
            return (
              <li key={id}>
                <span className="shop-icon">{it.icon}</span>
                <span className="shop-info">
                  <b>{it.name}</b>
                  <small>{it.desc}</small>
                  <em>Đang có {owned}/{it.max}</em>
                </span>
                <button
                  className="buy"
                  onClick={() => onBuy('item', id)}
                  disabled={full || coins < it.price}
                >
                  {full ? 'Đầy' : <><i className="coin" />{it.price}</>}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="shop-sub">Bùa</p>
        <ul className="shop-list">
          {Object.entries(PACKS).map(([id, pk]) => (
            <li key={id}>
              <span className="shop-icon">📜</span>
              <span className="shop-info">
                <b>{pk.name}</b>
                <em>Đang có {save.talismans.paper} Giấy, {save.talismans.gold} Vàng</em>
              </span>
              <button className="buy" onClick={() => onBuy('pack', id)} disabled={coins < pk.price}>
                <i className="coin" />{pk.price}
              </button>
            </li>
          ))}
        </ul>
        <div className="sheet-foot"><span>Kiếm vàng mã bằng cách phong ấn ma và sống sót qua đêm.</span></div>
      </div>
    </div>
  );
}
