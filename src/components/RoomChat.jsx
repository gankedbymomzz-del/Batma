import { useEffect, useRef, useState } from 'react';
import { CURSES } from '../curses.js';

export const EMOTES = ['😱', '😂', '🔥', '👏', '👻', '🙏'];
export const PHRASES = ['Cứu tôi!', 'Ma sau lưng!', 'Hạ máy xuống!', 'Sắp xong rồi!', 'Ván nữa không?', 'GG'];

// Khung chat dùng chung cho phòng chờ, mật thư, kết quả và lúc đang đua
export default function RoomChat({ messages, onSend, compact = false, autoFocus = false }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = (t) => {
    const v = (t ?? text).trim();
    if (!v) return;
    onSend(v);
    if (t == null) setText('');
  };

  return (
    <div className={`room-chat ${compact ? 'compact' : ''}`}>
      <div className="chat-list" ref={listRef} aria-live="polite">
        {messages.length === 0 && <p className="chat-empty">Chưa có tin nhắn. Chào cả phòng một câu đi!</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.y} ${m.me ? 'me' : ''}`}>
            {m.y === 'fx' ? <span>{m.n} {CURSES[m.fx]?.icon} {m.toName}: {CURSES[m.fx]?.name}</span>
              : m.y === 'sys' ? <span>{m.t}</span> : (
              <>
                {!m.me && <b>{m.n}</b>}
                <span className={m.y === 'emote' ? 'emo' : ''}>{m.t}</span>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="chat-quick">
        {EMOTES.map((e) => <button key={e} className="emo-btn" onClick={() => send(e)} aria-label={`Gửi ${e}`}>{e}</button>)}
      </div>
      <div className="chat-quick phrases">
        {PHRASES.map((p) => <button key={p} onClick={() => send(p)}>{p}</button>)}
      </div>
      <div className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 120))}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Nhắn cả phòng…"
          aria-label="Tin nhắn"
          autoComplete="off"
          enterKeyHint="send"
          autoFocus={autoFocus}
        />
        <button className="btn-primary small" onClick={() => send()} disabled={!text.trim()}>Gửi</button>
      </div>
    </div>
  );
}
