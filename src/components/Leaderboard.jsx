import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { nameKey } from '../lib/storage.js';
import { GHOSTS } from '../ghosts.js';

export default function Leaderboard({ player, onClose }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let alive = true;
    api.leaderboard(player?.name)
      .then((data) => alive && setState({ data }))
      .catch((e) => alive && setState({ error: e.message }));
    return () => { alive = false; };
  }, [player?.name]);

  const myKey = nameKey(player?.name);
  const d = state.data;
  const meInTop = d?.top.some((r) => r.key === myKey);

  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Bảng xếp hạng</h2>
          {d && <span className="count">{d.players} thợ săn</span>}
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {state.loading && <p className="board-msg">Đang tải…</p>}
        {state.error && (
          <p className="board-msg">
            {state.error}. Bạn vẫn chơi bình thường, điểm được lưu trên máy này.
          </p>
        )}
        {d && d.top.length === 0 && <p className="board-msg">Chưa có ai. Hãy là thợ săn đầu tiên.</p>}

        {d && d.top.length > 0 && (
          <ol className="board">
            {d.top.map((r) => (
              <li key={r.key} className={`${r.key === myKey ? 'me' : ''} top${r.rank}`}>
                <span className="rk">{r.rank}</span>
                <span className="nm">{r.name}<small>Cấp {r.level} · {r.species}/{GHOSTS.length} loài</small></span>
                <span className="sc">{r.xp.toLocaleString('vi-VN')}<small>XP</small></span>
              </li>
            ))}
            {d.me && !meInTop && (
              <li className="me gap">
                <span className="rk">{d.me.rank}</span>
                <span className="nm">{player.name}<small>Hạng của bạn</small></span>
                <span className="sc">{d.me.xp.toLocaleString('vi-VN')}<small>XP</small></span>
              </li>
            )}
          </ol>
        )}
      </div>
    </div>
  );
}
