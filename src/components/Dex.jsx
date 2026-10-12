import { useState } from 'react';
import Ghost from './Ghost.jsx';
import { GHOSTS, RARITY } from '../ghosts.js';
import { NIGHT_STORY, STORY_PAGES, LORE, LORE_NEED } from '../story.js';

export default function Dex({ save, onClose }) {
  const [tab, setTab] = useState('ghosts');
  const [sel, setSel] = useState(null);
  const [page, setPage] = useState(null);
  const caught = save.caught;
  const journal = save.journal || [];
  const count = GHOSTS.filter((g) => caught[g.id]).length;

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Sổ Ma</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div className="dex-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'ghosts'} className={tab === 'ghosts' ? 'on' : ''}
            onClick={() => { setTab('ghosts'); setSel(null); }}>
            Oan hồn {count}/{GHOSTS.length}
          </button>
          <button role="tab" aria-selected={tab === 'journal'} className={tab === 'journal' ? 'on' : ''}
            onClick={() => { setTab('journal'); setPage(null); }}>
            Nhật ký {journal.length}/{STORY_PAGES}
          </button>
        </div>

        {tab === 'ghosts' && (sel ? (
          <div className="dex-detail" style={{ '--rc': RARITY[sel.rarity].color }}>
            <Ghost def={sel} size={110} />
            <span className="rarity-chip">{RARITY[sel.rarity].label}</span>
            <p className="desc">{sel.desc}</p>
            {sel.hint && <p className="dex-hint"><b>Chiêu:</b> {sel.hint}</p>}
            {LORE[sel.id] && (caught[sel.id] >= LORE_NEED ? (
              <div className="journal-page">
                <p className="jp-kicker">Lai lịch: {LORE[sel.id].who}</p>
                <p className="jp-text">{LORE[sel.id].text}</p>
              </div>
            ) : (
              <p className="dex-lock">Phong ấn thêm {LORE_NEED - (caught[sel.id] || 0)} lần để biết oan hồn này là ai.</p>
            ))}
            <p className="meta">Đã phong ấn: {caught[sel.id]} lần</p>
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
                  <Ghost def={g} size={48} silhouette={!n} />
                  <b>{n ? (n >= LORE_NEED && LORE[g.id] ? LORE[g.id].who.split(',')[0] : RARITY[g.rarity].label) : '???'}</b>
                  {n > 0 && <small>×{n}</small>}
                </button>
              );
            })}
          </div>
        ))}

        {tab === 'journal' && (page ? (
          <div className="dex-detail">
            <div className="journal-page big">
              <p className="jp-kicker">Đêm {page} · {NIGHT_STORY[page].journal.title}</p>
              <p className="jp-text">{NIGHT_STORY[page].journal.text}</p>
              <p className="jp-author">— {NIGHT_STORY[page].journal.author}</p>
            </div>
            <button className="btn-ghost" onClick={() => setPage(null)}>Quay lại</button>
          </div>
        ) : (
          <ol className="journal-list">
            {Object.keys(NIGHT_STORY).map(Number).map((n) => {
              const open = journal.includes(n);
              return (
                <li key={n}>
                  <button disabled={!open} onClick={() => setPage(n)}>
                    <span className="jl-n">{n}</span>
                    <span className="jl-t">{open ? NIGHT_STORY[n].journal.title : 'Trang bị xé mất'}</span>
                    <small>{open ? NIGHT_STORY[n].journal.author : `Qua đêm ${n} để nhặt`}</small>
                  </button>
                </li>
              );
            })}
          </ol>
        ))}

        <div className="sheet-foot"><span>Tổng đã phong ấn: {save.total}</span></div>
      </div>
    </div>
  );
}
