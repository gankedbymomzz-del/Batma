import { useState } from 'react';
import Ghost from './Ghost.jsx';
import { GHOSTS, RARITY } from '../ghosts.js';

export default function Dex({ save, onClose, onReset }) {
  const [sel, setSel] = useState(null);
  const caught = save.caught;
  const count = GHOSTS.filter((g) => caught[g.id]).length;

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Sổ Ma</h2>
          <span className="count">{count}/{GHOSTS.length}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div className="progress"><i style={{ width: `${(count / GHOSTS.length) * 100}%` }} /></div>

        {sel ? (
          <div className="dex-detail" style={{ '--rc': RARITY[sel.rarity].color }}>
            <Ghost def={sel} size={120} />
            <h3>{sel.name}</h3>
            <span className="rarity-chip">{RARITY[sel.rarity].label}</span>
            <p className="desc">{sel.desc}</p>
            <p className="meta">Đã bắt: {caught[sel.id]} con</p>
            <button className="btn-ghost" onClick={() => setSel(null)}>Quay lại</button>
          </div>
        ) : (
          <div className="dex-grid">
            {GHOSTS.map((g, i) => {
              const n = caught[g.id] || 0;
              return (
                <button
                  key={g.id}
                  className={`dex-cell ${n ? '' : 'locked'}`}
                  style={{ '--rc': RARITY[g.rarity].color }}
                  onClick={() => n && setSel(g)}
                  disabled={!n}
                >
                  <span className="no">{i + 1}</span>
                  <Ghost def={g} size={62} silhouette={!n} />
                  <b>{n ? g.name : '???'}</b>
                  {n > 0 && <small>×{n}</small>}
                </button>
              );
            })}
          </div>
        )}

        <div className="sheet-foot">
          <span>Tổng đã bắt: {save.total}</span>
          <button
            className="link-btn"
            onClick={() => { if (window.confirm('Xoá toàn bộ tiến độ săn ma?')) onReset(); }}
          >
            Xoá tiến độ
          </button>
        </div>
      </div>
    </div>
  );
}
