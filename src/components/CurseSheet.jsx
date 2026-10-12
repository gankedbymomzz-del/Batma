import { CURSES } from '../curses.js';

// Bảng lời nguyền: chọn đối thủ và lời nguyền
export default function CurseSheet({ rivals, coins, cdLeft, onCurse, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="sheet curse-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Lời nguyền</h2>
          <span className="coin-pill"><i className="coin" />{coins}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <ul className="curse-legend">
          {Object.values(CURSES).map((c) => (
            <li key={c.name}>
              <span className="ci">{c.icon}</span>
              <div><b>{c.name}</b> <span className="cost"><i className="coin" />{c.cost}</span><small>{c.desc}</small></div>
            </li>
          ))}
        </ul>
        {cdLeft > 0 && <p className="curse-cd">Đang hồi chiêu: {Math.ceil(cdLeft / 1000)} giây</p>}
        {rivals.length === 0 && <p className="board-msg">Không có ai khác trong phòng.</p>}
        <ul className="curse-targets">
          {rivals.map((p) => (
            <li key={p.key}>
              <span className="nm">{p.name}<small>{p.caught}/{p.quota} con</small></span>
              {Object.entries(CURSES).map(([id, c]) => (
                <button
                  key={id}
                  className={`curse-btn ${id}`}
                  onClick={() => onCurse(p, id)}
                  disabled={cdLeft > 0 || coins < c.cost}
                  aria-label={`${c.name} lên ${p.name}, giá ${c.cost}`}
                  title={`${c.name} (${c.cost})`}
                >
                  {c.icon}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
