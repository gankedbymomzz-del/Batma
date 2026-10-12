import Ghost from './Ghost.jsx';
import { RARITY } from '../ghosts.js';

export default function CaughtCard({ data, onClose }) {
  const { def, xp, coins, levelUp, level, isNew, bonusPaper, hpGain, streak = 1, loreUnlocked } = data;
  const r = RARITY[def.rarity];
  return (
    <div className="modal center">
      <div className="caught-card" style={{ '--rc': r.color }}>
        <div className="seal-bg" />
        {isNew && <div className="badge-new">Mới vào Sổ Ma</div>}
        <div className="caught-ghost"><Ghost def={def} size={110} /></div>
        <h2>Phong ấn thành công</h2>
        <span className="rarity-chip">{r.label}</span>
        <p className="desc">{def.desc}</p>
        <div className="rewards">
          <span>+{xp} XP</span>
          {streak > 1 && <span className="lv">Chuỗi ×{streak.toFixed(1)}</span>}
          <span><i className="coin" />+{coins}</span>
          <span>+{bonusPaper} Bùa Giấy</span>
          {hpGain && <span>+1 Dương khí</span>}
          {levelUp && <span className="lv">Lên cấp {level}, tặng 3 Bùa Vàng</span>}
        </div>
        {loreUnlocked && <p className="title-up">Mở khoá <b>lai lịch</b> của oan hồn này trong Sổ Ma</p>}
        <button className="btn-primary" onClick={onClose} autoFocus>Săn tiếp</button>
      </div>
    </div>
  );
}
