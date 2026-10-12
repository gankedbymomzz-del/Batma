import { useState } from 'react';
import Ghost from './Ghost.jsx';
import { GHOSTS } from '../ghosts.js';
import { titleFor } from '../titles.js';

export default function StartScreen({ player, nightsCleared = 0, onLogin, onLogout, onStart, starting }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const valid = name.trim().length >= 2;

  const submit = async () => {
    if (!valid || busy) return;
    setErr('');
    setBusy(true);
    try { await onLogin(name.trim()); } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div className="start">
      <div className="start-art"><Ghost def={GHOSTS[3]} size={120} /></div>
      <h1>Săn Ma</h1>
      <p className="tag">Chúng ở quanh bạn.<br />Phong ấn chúng trước khi chúng tìm đến bạn.</p>

      {!player ? (
        <div className="login">
          <label htmlFor="pname">Đặt tên thợ săn</label>
          <input
            id="pname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            maxLength={16}
            placeholder="Tên hiển thị trên bảng xếp hạng"
            autoComplete="off"
            enterKeyHint="go"
          />
          {err && <p className="err">{err}</p>}
          <button className="btn-primary" onClick={submit} disabled={!valid || busy}>
            {busy ? 'Đang ghi danh…' : 'Ghi danh'}
          </button>
        </div>
      ) : (
        <div className="login">
          <p className="hello">
            {titleFor(nightsCleared)} <b>{player.name}</b>
            {player.offline && <small>Đang chơi ngoại tuyến, điểm chưa lên bảng xếp hạng</small>}
            <small>{nightsCleared > 0 ? `Đã qua ${nightsCleared} đêm. Tiếp tục đêm ${nightsCleared + 1}` : 'Bắt đầu từ đêm 1'}</small>
          </p>
          <button className="btn-primary" onClick={onStart} disabled={starting}>
            {starting ? 'Đang mở camera…' : `Vào đêm ${nightsCleared + 1}`}
          </button>
          <button className="link-btn" onClick={onLogout}>Đổi tên</button>
        </div>
      )}

      <p className="warn">
        Cảnh báo: âm thanh lớn, hình ảnh nhấp nháy và hù doạ bất ngờ. Không dành cho trẻ em,
        người yếu tim hoặc nhạy cảm với ánh sáng nhấp nháy. Nên đeo tai nghe.
      </p>

      <ul className="notes">
        <li>Bấm <b>Cho phép</b> khi được hỏi quyền Camera và Chuyển động</li>
        <li>Mỗi đêm phong ấn đủ số oan hồn để thấy trời sáng. Đêm sau khó hơn đêm trước</li>
        <li>Trên máy tính: kéo chuột hoặc dùng phím mũi tên</li>
      </ul>
    </div>
  );
}
