import { useEffect, useState } from 'react';
import { TWISTS } from '../twists.js';
import RoomChat from './RoomChat.jsx';

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// Giao diện phòng chơi chung: sảnh → phòng chờ → mật thư → đếm ngược → kết quả
export default function RoomPanel({ room, offset, busy, error, chat = [], unread = 0, onChat, onReadChat, onCreate, onJoin, onStart, onAnswer, onReset, onLeave, onSolo }) {
  const [code, setCode] = useState('');
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(0);
  const [, tick] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const chatBox = (
    <div className="chat-wrap">
      <button className="chat-toggle" onClick={() => { setChatOpen(!chatOpen); onReadChat?.(); }}>
        Trò chuyện {chat.length > 0 && `(${chat.filter((m) => m.y !== 'sys').length})`}
        {!chatOpen && unread > 0 && <i className="badge">{unread}</i>}
        <span>{chatOpen ? 'Thu gọn' : 'Mở'}</span>
      </button>
      {chatOpen && <RoomChat messages={chat} onSend={onChat} compact />}
    </div>
  );

  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 250); return () => clearInterval(t); }, []);
  useEffect(() => { setAnswer(''); }, [room?.status, room?.round]);

  const now = Date.now() + offset;
  // thời gian còn lại tính theo đồng hồ máy chủ
  const since = room ? now - room.now : 0;

  const submit = async () => {
    if (!answer.trim() || busy) return;
    const ok = await onAnswer(answer.trim());
    if (ok === false) setWrong((w) => w + 1);
  };

  // ---------- Sảnh: tạo hoặc vào phòng ----------
  if (!room) {
    return (
      <div className="modal center room-modal">
        <div className="room-card">
          <p className="night-kicker">Hồ sơ nhà số 7</p>
          <h2>Phòng chơi chung</h2>
          <p className="desc">Cả phòng cùng giải một mật thư. Giải xong, tất cả đua phong ấn 5 oan hồn. Ai xong trước thắng.</p>
          <button className="btn-primary" onClick={onCreate} disabled={busy}>Tạo phòng mới</button>
          <div className="room-or"><span>hoặc vào phòng có sẵn</span></div>
          <div className="room-join">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(e) => e.key === 'Enter' && code.length === 4 && onJoin(code)}
              inputMode="numeric"
              placeholder="Mã 4 số"
              aria-label="Mã phòng"
            />
            <button className="btn-ghost" onClick={() => onJoin(code)} disabled={busy || code.length !== 4}>Vào phòng</button>
          </div>
          {error && <p className="err">{error}</p>}
          <button className="link-btn" onClick={onSolo}>Quay lại chơi một mình</button>
        </div>
      </div>
    );
  }

  const me = room.players.find((p) => p.me);
  const isHost = me?.host;
  const players = (
    <ul className="room-players">
      {room.players.map((p) => (
        <li key={p.key} className={`${p.me ? 'me' : ''} ${p.online ? '' : 'off'}`}>
          <span className="nm">{p.name}{p.host && <em>chủ phòng</em>}</span>
          {room.status !== 'lobby' && room.status !== 'puzzle' && <span className="sc">{p.caught}/{room.quota}</span>}
        </li>
      ))}
    </ul>
  );

  // ---------- Phòng chờ ----------
  if (room.status === 'lobby') {
    return (
      <div className="modal center room-modal">
        <div className="room-card">
          <p className="night-kicker">Mã phòng</p>
          <button className="room-code" onClick={() => navigator.clipboard?.writeText(room.code)} title="Chạm để sao chép">
            {room.code}
          </button>
          <p className="desc">Gửi mã này cho mọi người. {room.players.length} thợ săn đang chờ.</p>
          {players}
          {isHost ? (
            <button className="btn-primary" onClick={onStart} disabled={busy}>Bắt đầu ván {room.round}</button>
          ) : (
            <p className="room-wait">Chờ chủ phòng bắt đầu…</p>
          )}
          {error && <p className="err">{error}</p>}
          {chatBox}
          <button className="link-btn" onClick={onLeave}>Rời phòng</button>
        </div>
      </div>
    );
  }

  // ---------- Giải mật thư ----------
  const pz = room.puzzle;
  if (room.status === 'puzzle' && pz) {
    const deadline = (pz.deadlineIn ?? 0) - since;
    const nextHint = pz.nextHintIn != null ? pz.nextHintIn - since : null;
    return (
      <div className="modal center room-modal puzzle-modal">
        <div className="room-card puzzle-card">
          <p className="night-kicker">Mật thư · còn {mmss(deadline)}</p>
          <h2>{pz.title}</h2>
          <p className="puzzle-story">{pz.story}</p>
          <div className={`cipher ${pz.style}`}>
            {pz.lines.map((l, i) => <div key={i}>{l || '\u00a0'}</div>)}
          </div>
          <p className="puzzle-q">{pz.question}</p>
          {pz.hints.map((h, i) => <p key={i} className="puzzle-hint"><b>Gợi ý {i + 1}:</b> {h}</p>)}
          {nextHint != null && nextHint > 0 && <p className="puzzle-next">Gợi ý tiếp theo sau {mmss(nextHint)}</p>}
          <div className={`room-join ${wrong ? 'shake-x' : ''}`} key={wrong}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Nhập đáp án"
              aria-label="Đáp án"
              autoComplete="off"
              enterKeyHint="send"
            />
            <button className="btn-primary small" onClick={submit} disabled={busy || !answer.trim()}>Giải</button>
          </div>
          {wrong > 0 && <p className="err">Chưa đúng. Cả phòng cùng nghĩ tiếp nhé.</p>}
          {error && <p className="err">{error}</p>}
          <p className="puzzle-tip">Ai trong phòng đoán đúng trước, cả phòng cùng sang màn đua.</p>
          {chatBox}
          {players}
        </div>
      </div>
    );
  }

  // ---------- Đã giải xong, đếm ngược ----------
  if (room.status === 'race' && pz) {
    const left = room.raceStart - now;
    return (
      <div className="modal center room-modal">
        <div className="room-card">
          <p className="night-kicker">{pz.skipped ? 'Hết giờ giải mật thư' : `${pz.solvedBy} đã giải được`}</p>
          <h2 className="answer">{pz.answer}</h2>
          <p className="puzzle-story">{pz.reveal}</p>
          {TWISTS[pz.twist] && (
            <div className="twist-box">
              <b>Manh mối cho màn đua: {TWISTS[pz.twist].label}</b>
              <span>{TWISTS[pz.twist].hint}</span>
            </div>
          )}
          {me && pz.solvedBy === me.name && <p className="title-up">Bạn giải được: thưởng <b>+1 Chuông trấn hồn</b></p>}
          <div className="countdown">{left > 0 ? Math.ceil(left / 1000) : '!'}</div>
          <p className="room-wait">Chuẩn bị bùa. Phong ấn {room.quota} oan hồn trước người khác!</p>
        </div>
      </div>
    );
  }

  // ---------- Kết quả ----------
  if (room.status === 'done') {
    const won = room.winner && me && room.winner === me.key;
    return (
      <div className={`modal center room-modal ${won ? 'dawn' : ''}`}>
        <div className="room-card">
          <p className="night-kicker">{room.timeout ? 'Hết giờ đua' : 'Kết thúc ván'} {room.round}</p>
          <h2>{room.winnerName ? (won ? 'Bạn thắng!' : `${room.winnerName} thắng`) : 'Không ai thắng'}</h2>
          <ol className="room-players result">
            {room.players.map((p, i) => (
              <li key={p.key} className={p.me ? 'me' : ''}>
                <span className="rk">{i + 1}</span>
                <span className="nm">{p.name}</span>
                <span className="sc">
                  {p.caught}/{room.quota}
                  {p.finishedAt && <small>{(p.finishedAt / 1000).toFixed(1)}s</small>}
                </span>
              </li>
            ))}
          </ol>
          {isHost ? (
            <button className="btn-primary" onClick={onReset} disabled={busy}>Mở ván mới</button>
          ) : (
            <p className="room-wait">Chờ chủ phòng mở ván mới…</p>
          )}
          {chatBox}
          <button className="link-btn" onClick={onLeave}>Rời phòng</button>
        </div>
      </div>
    );
  }

  return null;
}
