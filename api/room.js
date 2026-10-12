// POST /api/room { action, name, token, code?, answer?, caught? }
// action: create | join | state | start | answer | progress | reset | leave
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
const touch = (c) => [['EXPIRE', rk(c), TTL], ['EXPIRE', pk(c), TTL], ['EXPIRE', sk(c), TTL]];

async function auth(b) {
  const key = keyOf(b.name);
  const p = toObj(await redis('HGETALL', `p:${key}`));
  if (!p.token || !b.token || p.token !== hash(b.token)) return null;
  return { key, name: p.name };
}

async function load(code) {
  const [r, ps, seen] = await pipeline([['HGETALL', rk(code)], ['HGETALL', pk(code)], ['HGETALL', sk(code)]]);
  const room = toObj(r);
  if (!room.status) return null;
  const players = {};
  const po = toObj(ps);
  for (const k of Object.keys(po)) { try { players[k] = JSON.parse(po[k]); } catch { /* bỏ qua */ } }
  return { room, players, seen: toObj(seen) };
}

// Chuyển trạng thái tự động theo thời gian
async function tick(code, st) {
  const { room, players } = st;
  const now = Date.now();
  const set = {};
  if (room.status === 'puzzle' && now - Number(room.puzzleStart) > PUZZLE_MS) {
    Object.assign(set, { status: 'race', raceStart: now + COUNTDOWN_MS, skipped: '1' });
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
  }
}

function view(code, { room, players, seen }, meKey) {
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
  };
}

const resetFields = ['winner', 'winnerName', 'solvedBy', 'solvedAt', 'skipped', 'timeout', 'endedAt'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Chỉ hỗ trợ POST' });
  if (!hasDb()) return send(res, 503, { error: 'Chế độ phòng cần bật Upstash Redis' });

  try {
    const b = body(req);
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
      return send(res, 200, { room: view(code, await load(code), me.key) });
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
      }
      await redis('HSET', sk(code), me.key, now);
      st.seen[me.key] = now;
      return send(res, 200, { room: view(code, st, me.key) });
    }

    if (!mine) return send(res, 403, { error: 'Bạn không ở trong phòng này' });

    if (b.action === 'state') {
      await tick(code, st);
      if (now - Number(st.seen[me.key] || 0) > 5000) { await redis('HSET', sk(code), me.key, now); st.seen[me.key] = now; }
      return send(res, 200, { room: view(code, st, me.key) });
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
      return send(res, 200, { room: view(code, await load(code), me.key) });
    }

    if (b.action === 'answer') {
      if (st.room.status !== 'puzzle') return send(res, 200, { ok: false, room: view(code, st, me.key) });
      const slow = await redis('SET', `room:${code}:ans:${me.key}`, 1, 'PX', 1500, 'NX');
      if (!slow) return send(res, 429, { error: 'Chậm lại một chút rồi đoán tiếp' });
      if (!checkAnswer(PUZZLES[Number(st.room.puzzle)], b.answer)) {
        return send(res, 200, { ok: false, room: view(code, st, me.key) });
      }
      if (await redis('HSETNX', rk(code), 'solvedBy', me.name)) {
        await pipeline([['HSET', rk(code), 'status', 'race', 'raceStart', now + COUNTDOWN_MS, 'solvedAt', now], ...touch(code)]);
      }
      return send(res, 200, { ok: true, room: view(code, await load(code), me.key) });
    }

    if (b.action === 'progress') {
      const rs = Number(st.room.raceStart);
      if (st.room.status !== 'race' || now < rs) return send(res, 200, { room: view(code, st, me.key) });
      const prev = mine.caught || 0;
      const want = Math.max(0, Math.floor(Number(b.caught) || 0));
      const c = Math.min(want, prev + 1, QUOTA, Math.floor((now - rs) / MIN_CATCH_MS));
      if (c > prev) {
        const p = { ...mine, caught: c, lastCatchAt: now };
        if (c >= QUOTA) p.finishedAt = now - rs;
        await pipeline([['HSET', pk(code), me.key, JSON.stringify(p)], ...touch(code)]);
        if (c >= QUOTA && await redis('HSETNX', rk(code), 'winner', me.key)) {
          await redis('HSET', rk(code), 'winnerName', me.name, 'status', 'done', 'endedAt', now);
        }
      }
      return send(res, 200, { room: view(code, await load(code), me.key) });
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
      return send(res, 200, { room: view(code, await load(code), me.key) });
    }

    if (b.action === 'leave') {
      const rest = Object.keys(st.players).filter((k) => k !== me.key);
      if (!rest.length) {
        await pipeline([['DEL', rk(code)], ['DEL', pk(code)], ['DEL', sk(code)]]);
      } else {
        const cmds = [['HDEL', pk(code), me.key], ['HDEL', sk(code), me.key]];
        if (st.room.host === me.key) cmds.push(['HSET', rk(code), 'host', rest[0]]);
        await pipeline(cmds);
      }
      return send(res, 200, { left: true });
    }

    return send(res, 400, { error: 'Hành động không hợp lệ' });
  } catch (e) {
    return send(res, 500, { error: 'Lỗi máy chủ, thử lại sau' });
  }
}
