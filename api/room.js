// POST /api/room { action, name, token, code?, answer?, caught? }
// action: create | join | state | start | answer | progress | reset | leave | chat | curse
// Máy chủ giữ trạng thái phòng và quyết định người thắng — không tin máy người chơi.
import crypto from 'node:crypto';
import { hasDb, redis, pipeline, keyOf, hash, toObj, body, send } from './_lib/redis.js';
import { PUZZLES, checkAnswer } from './_lib/puzzles.js';

const TTL = 7200;              // phòng tự xoá sau 2 giờ không hoạt động
const MAX_PLAYERS = 12;
const QUOTA = 5;               // số ma cần phong ấn để thắng
const PUZZLE_MS = 240000;      // 4 phút giải mật thư, quá giờ thì tự bỏ qua
const HINT_MS = [60000, 120000];
const COUNTDOWN_MS = 6000;     // đếm ngược trước khi đua
const RACE_MS = 360000;        // đua tối đa 6 phút, hết giờ ai bắt nhiều nhất thắng
const MIN_CATCH_MS = 3000;     // chống gian lận: tối thiểu 3 giây mỗi con

const rk = (c) => `room:${c}`;
const pk = (c) => `room:${c}:players`;
const sk = (c) => `room:${c}:seen`;
const ck = (c) => `room:${c}:chat`;
const qk = (c) => `room:${c}:chatseq`;
const touch = (c) => [['EXPIRE', rk(c), TTL], ['EXPIRE', pk(c), TTL], ['EXPIRE', sk(c), TTL], ['EXPIRE', ck(c), TTL], ['EXPIRE', qk(c), TTL]];

// ====== CHAT ======
const CHAT_KEEP = 60;           // giữ 60 tin gần nhất
const CHAT_MAX_LEN = 120;
const EMOTES = ['😱', '😂', '🔥', '👏', '👻', '🙏'];
// lọc từ thô tục cơ bản (game nội bộ)
const BAD = ['đm', 'đmm', 'dm', 'dmm', 'đcm', 'dcm', 'vcl', 'vkl', 'vl', 'clm', 'cmm', 'địt', 'lồn', 'cặc', 'buồi', 'đụ', 'đĩ', 'fuck', 'shit'];
const BAD_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${BAD.join('|')})(?![\\p{L}\\p{N}])`, 'giu');
const cleanText = (t) => String(t || '').normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX_LEN).replace(BAD_RE, '***');

async function pushMsg(code, msg) {
  const id = await redis('INCR', qk(code));
  await pipeline([
    ['RPUSH', ck(code), JSON.stringify({ id, ts: Date.now(), ...msg })],
    ['LTRIM', ck(code), -CHAT_KEEP, -1],
    ...touch(code),
  ]);
}
const sys = (code, t) => pushMsg(code, { y: 'sys', t });

// ====== LỜI NGUYỀN GIỮA NGƯỜI CHƠI ======
// race: chỉ dùng khi đang đua | Giá vàng mã trừ ở máy người chơi (src/curses.js)
const CURSES = { dark: { race: true }, knock: { race: true }, gift: { race: false } };
const CURSE_CD = 12000;    // mỗi người hồi chiêu 12 giây
const IMMUNE_MS = 8000;    // người vừa bị nguyền được miễn nhiễm 8 giây

async function auth(b) {
  const key = keyOf(b.name);
  const p = toObj(await redis('HGETALL', `p:${key}`));
  if (!p.token || !b.token || p.token !== hash(b.token)) return null;
  return { key, name: p.name };
}

async function load(code) {
  const [r, ps, seen, chat] = await pipeline([
    ['HGETALL', rk(code)], ['HGETALL', pk(code)], ['HGETALL', sk(code)], ['LRANGE', ck(code), -40, -1],
  ]);
  const room = toObj(r);
  if (!room.status) return null;
  const players = {};
  const po = toObj(ps);
  for (const k of Object.keys(po)) { try { players[k] = JSON.parse(po[k]); } catch { /* bỏ qua */ } }
  const msgs = (chat || []).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
  return { room, players, seen: toObj(seen), chat: msgs };
}

// Chuyển trạng thái tự động theo thời gian
async function tick(code, st) {
  const { room, players } = st;
  const now = Date.now();
  const set = {};
  if (room.status === 'puzzle' && now - Number(room.puzzleStart) > PUZZLE_MS) {
    Object.assign(set, { status: 'race', raceStart: now + COUNTDOWN_MS, skipped: '1' });
    st.sysMsg = 'Hết giờ! Mật thư tự lộ đáp án. Chuẩn bị đua!';
  }
  if (room.status === 'race' && !room.winner && now > Number(room.raceStart) + RACE_MS) {
    const best = Object.entries(players)
      .sort(([, a], [, b]) => (b.caught || 0) - (a.caught || 0) || (a.lastCatchAt || 9e15) - (b.lastCatchAt || 9e15))[0];
    Object.assign(set, { status: 'done', endedAt: now, timeout: '1' });
    if (best && best[1].caught > 0) Object.assign(set, { winner: best[0], winnerName: best[1].name });
  }
  if (Object.keys(set).length) {
    await pipeline([['HSET', rk(code), ...Object.entries(set).flat()], ...touch(code)]);
    Object.assign(room, set);
    if (set.status === 'done') st.sysMsg = set.winnerName ? `Hết giờ đua! ${set.winnerName} bắt nhiều nhất và thắng.` : 'Hết giờ đua! Không ai phong ấn được con nào.';
    if (st.sysMsg) { await sys(code, st.sysMsg); const fresh = await load(code); st.chat = fresh.chat; }
  }
}

function view(code, { room, players, seen, chat }, meKey, since = 0) {
  const now = Date.now();
  const pz = PUZZLES[Number(room.puzzle)];
  let puzzle = null;
  if (room.status !== 'lobby' && pz) {
    const el = now - Number(room.puzzleStart);
    const solved = room.status !== 'puzzle';
    const next = HINT_MS.find((t) => t > el);
    puzzle = {
      title: pz.title, story: pz.story, style: pz.style, lines: pz.lines, question: pz.question,
      hints: pz.hints.filter((_, i) => solved || el >= HINT_MS[i]),
      nextHintIn: solved || next == null ? null : next - el,
      deadlineIn: solved ? null : Math.max(0, PUZZLE_MS - el),
      solved, solvedBy: room.solvedBy || null, skipped: room.skipped === '1',
      answer: solved ? pz.display : null, reveal: solved ? pz.reveal : null,
      twist: solved ? pz.twist : null,
    };
  }
  const list = Object.entries(players).map(([k, p]) => ({
    key: k, name: p.name, caught: p.caught || 0, finishedAt: p.finishedAt || null,
    online: now - Number(seen[k] || 0) < 15000, host: k === room.host, me: k === meKey,
  })).sort((a, b) => b.caught - a.caught || (a.finishedAt || 9e15) - (b.finishedAt || 9e15));
  return {
    code, status: room.status, host: room.host, quota: QUOTA, round: Number(room.round) || 1,
    seed: Number(room.seed) || 0, raceStart: Number(room.raceStart) || 0, raceMs: RACE_MS,
    winner: room.winner || null, winnerName: room.winnerName || null, timeout: room.timeout === '1',
    players: list, puzzle, now,
    chat: (chat || []).filter((m) => m.id > since),
  };
}

const resetFields = ['winner', 'winnerName', 'solvedBy', 'solvedAt', 'skipped', 'timeout', 'endedAt'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Chỉ hỗ trợ POST' });
  if (!hasDb()) return send(res, 503, { error: 'Chế độ phòng cần bật Upstash Redis' });

  try {
    const b = body(req);
    const since = Math.max(0, Number(b.since) || 0);
    const me = await auth(b);
    if (!me) return send(res, 401, { error: 'Cần ghi danh online để chơi phòng' });
    const now = Date.now();

    if (b.action === 'create') {
      let code = null;
      for (let i = 0; i < 15 && !code; i += 1) {
        const c = String(crypto.randomInt(1000, 10000));
        if (await redis('HSETNX', rk(c), 'status', 'lobby')) code = c;
      }
      if (!code) return send(res, 503, { error: 'Không tạo được phòng, thử lại' });
      await pipeline([
        ['HSET', rk(code), 'host', me.key, 'createdAt', now, 'round', 1],
        ['HSET', pk(code), me.key, JSON.stringify({ name: me.name, caught: 0 })],
        ['HSET', sk(code), me.key, now],
        ...touch(code),
      ]);
      return send(res, 200, { room: view(code, await load(code), me.key, since) });
    }

    const code = String(b.code || '').replace(/\D/g, '').slice(0, 4);
    if (code.length !== 4) return send(res, 400, { error: 'Mã phòng gồm 4 chữ số' });
    const st = await load(code);
    if (!st) return send(res, 404, { error: 'Không tìm thấy phòng, có thể đã hết hạn' });
    const mine = st.players[me.key];

    if (b.action === 'join') {
      if (!mine) {
        if (st.room.status !== 'lobby') return send(res, 409, { error: 'Phòng đang chơi, chờ ván sau nhé' });
        if (Object.keys(st.players).length >= MAX_PLAYERS) return send(res, 409, { error: `Phòng đã đủ ${MAX_PLAYERS} người` });
        st.players[me.key] = { name: me.name, caught: 0 };
        await pipeline([['HSET', pk(code), me.key, JSON.stringify(st.players[me.key])], ...touch(code)]);
        await sys(code, `${me.name} đã vào phòng`);
        st.chat = (await load(code)).chat;
      }
      await redis('HSET', sk(code), me.key, now);
      st.seen[me.key] = now;
      return send(res, 200, { room: view(code, st, me.key, since) });
    }

    if (!mine) return send(res, 403, { error: 'Bạn không ở trong phòng này' });

    if (b.action === 'state') {
      await tick(code, st);
      if (now - Number(st.seen[me.key] || 0) > 5000) { await redis('HSET', sk(code), me.key, now); st.seen[me.key] = now; }
      return send(res, 200, { room: view(code, st, me.key, since) });
    }

    if (b.action === 'start') {
      if (st.room.host !== me.key) return send(res, 403, { error: 'Chỉ chủ phòng mới bắt đầu được' });
      if (st.room.status !== 'lobby') return send(res, 409, { error: 'Ván đã bắt đầu' });
      let used = String(st.room.used || '').split(',').filter(Boolean).map(Number);
      let pool = PUZZLES.map((_, i) => i).filter((i) => !used.includes(i));
      if (!pool.length) { used = []; pool = PUZZLES.map((_, i) => i); }
      const pz = pool[crypto.randomInt(0, pool.length)];
      const reset = Object.entries(st.players).flatMap(([k, p]) => [k, JSON.stringify({ name: p.name, caught: 0 })]);
      await pipeline([
        ['HDEL', rk(code), ...resetFields],
        ['HSET', rk(code), 'status', 'puzzle', 'puzzle', pz, 'puzzleStart', now, 'raceStart', 0,
          'seed', crypto.randomInt(1, 2 ** 31 - 1), 'used', [...used, pz].join(',')],
        ['HSET', pk(code), ...reset],
        ...touch(code),
      ]);
      await sys(code, 'Ván mới bắt đầu. Mật thư đã được mở!');
      return send(res, 200, { room: view(code, await load(code), me.key, since) });
    }

    if (b.action === 'answer') {
      if (st.room.status !== 'puzzle') return send(res, 200, { ok: false, room: view(code, st, me.key, since) });
      const slow = await redis('SET', `room:${code}:ans:${me.key}`, 1, 'PX', 1500, 'NX');
      if (!slow) return send(res, 429, { error: 'Chậm lại một chút rồi đoán tiếp' });
      if (!checkAnswer(PUZZLES[Number(st.room.puzzle)], b.answer)) {
        return send(res, 200, { ok: false, room: view(code, st, me.key, since) });
      }
      if (await redis('HSETNX', rk(code), 'solvedBy', me.name)) {
        await pipeline([['HSET', rk(code), 'status', 'race', 'raceStart', now + COUNTDOWN_MS, 'solvedAt', now], ...touch(code)]);
        await sys(code, `${me.name} đã giải được mật thư!`);
      }
      return send(res, 200, { ok: true, room: view(code, await load(code), me.key, since) });
    }

    if (b.action === 'progress') {
      const rs = Number(st.room.raceStart);
      if (st.room.status !== 'race' || now < rs) return send(res, 200, { room: view(code, st, me.key, since) });
      const prev = mine.caught || 0;
      const want = Math.max(0, Math.floor(Number(b.caught) || 0));
      const c = Math.min(want, prev + 1, QUOTA, Math.floor((now - rs) / MIN_CATCH_MS));
      if (c > prev) {
        const p = { ...mine, caught: c, lastCatchAt: now };
        if (c >= QUOTA) p.finishedAt = now - rs;
        await pipeline([['HSET', pk(code), me.key, JSON.stringify(p)], ...touch(code)]);
        if (c === QUOTA - 1) await sys(code, `${me.name} chỉ còn 1 con nữa!`);
        if (c >= QUOTA && await redis('HSETNX', rk(code), 'winner', me.key)) {
          await redis('HSET', rk(code), 'winnerName', me.name, 'status', 'done', 'endedAt', now);
          await sys(code, `${me.name} đã phong ấn đủ ${QUOTA} oan hồn và THẮNG!`);
        }
      }
      return send(res, 200, { room: view(code, await load(code), me.key, since) });
    }

    if (b.action === 'reset') {
      if (st.room.host !== me.key) return send(res, 403, { error: 'Chỉ chủ phòng mới mở ván mới được' });
      const reset = Object.entries(st.players).flatMap(([k, p]) => [k, JSON.stringify({ name: p.name, caught: 0 })]);
      await pipeline([
        ['HDEL', rk(code), ...resetFields],
        ['HSET', rk(code), 'status', 'lobby', 'raceStart', 0, 'round', (Number(st.room.round) || 1) + 1],
        ['HSET', pk(code), ...reset],
        ...touch(code),
      ]);
      return send(res, 200, { room: view(code, await load(code), me.key, since) });
    }

    if (b.action === 'leave') {
      const rest = Object.keys(st.players).filter((k) => k !== me.key);
      if (!rest.length) {
        await pipeline([['DEL', rk(code)], ['DEL', pk(code)], ['DEL', sk(code)]]);
      } else {
        const cmds = [['HDEL', pk(code), me.key], ['HDEL', sk(code), me.key]];
        if (st.room.host === me.key) cmds.push(['HSET', rk(code), 'host', rest[0]]);
        await pipeline(cmds);
        await sys(code, `${me.name} đã rời phòng`);
      }
      return send(res, 200, { left: true });
    }

    if (b.action === 'chat') {
      const text = cleanText(b.text);
      if (!text) return send(res, 400, { error: 'Tin nhắn trống' });
      const slow = await redis('SET', `room:${code}:chatrl:${me.key}`, 1, 'PX', 800, 'NX');
      if (!slow) return send(res, 429, { error: 'Gửi chậm lại một chút' });
      await pushMsg(code, { y: EMOTES.includes(text) ? 'emote' : 'msg', k: me.key, n: me.name, t: text });
      return send(res, 200, { room: view(code, await load(code), me.key, since) });
    }

    if (b.action === 'curse') {
      const kind = String(b.kind || '');
      if (!CURSES[kind]) return send(res, 400, { error: 'Lời nguyền không hợp lệ' });
      const tk = String(b.target || '');
      if (!st.players[tk] || tk === me.key) return send(res, 400, { error: 'Hãy chọn một người chơi khác' });
      if (!['puzzle', 'race'].includes(st.room.status)) return send(res, 409, { error: 'Chỉ dùng được trong ván đang chơi' });
      if (CURSES[kind].race && (st.room.status !== 'race' || now < Number(st.room.raceStart))) {
        return send(res, 409, { error: 'Lời nguyền này chỉ dùng khi đang đua' });
      }
      const cdKey = `room:${code}:cd:${me.key}`;
      if (!await redis('SET', cdKey, 1, 'PX', CURSE_CD, 'NX')) return send(res, 429, { error: 'Lời nguyền đang hồi, chờ chút' });
      if (kind !== 'gift' && !await redis('SET', `room:${code}:imm:${tk}`, 1, 'PX', IMMUNE_MS, 'NX')) {
        await redis('DEL', cdKey);
        return send(res, 409, { error: `${st.players[tk].name} vừa bị nguyền, thử người khác` });
      }
      await pushMsg(code, { y: 'fx', k: me.key, n: me.name, to: tk, toName: st.players[tk].name, fx: kind });
      return send(res, 200, { ok: true, room: view(code, await load(code), me.key, since) });
    }

    return send(res, 400, { error: 'Hành động không hợp lệ' });
  } catch (e) {
    return send(res, 500, { error: 'Lỗi máy chủ, thử lại sau' });
  }
}
