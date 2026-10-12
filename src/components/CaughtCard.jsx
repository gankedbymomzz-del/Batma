import Ghost from './Ghost.jsx';
import { RARITY } from '../ghosts.js';

export default function CaughtCard({ data, onClose }) {
  const { def, xp, levelUp, level, isNew, bonusPaper, hpGain } = data;
  const r = RARITY[def.rarity];
  return (
    <div className="modal center">
      <div className="caught-card" style={{ '--rc': r.color }}>
        <div className="seal-bg" />
        {isNew && <div className="badge-new">Mới vào Sổ Ma</div>}
        <div className="caught-ghost"><Ghost def={def} size={110} /></div>
        <p className="caught-title">Phong ấn thành công</p>
        <h2>{def.name}</h2>
        <span className="rarity-chip">{r.label}</span>
        <p className="desc">{def.desc}</p>
        <div className="rewards">
          <span>+{xp} XP</span>
          <span>+{bonusPaper} Bùa Giấy</span>
          {hpGain && <span>+1 Dương khí</span>}
          {levelUp && <span className="lv">Lên cấp {level}, tặng 3 Bùa Vàng</span>}
        </div>
        <button className="btn-primary" onClick={onClose} autoFocus>Săn tiếp</button>
      </div>
    </div>
  );
}
