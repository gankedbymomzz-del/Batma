// POST /api/score { name, token, xp, total, species } — cập nhật điểm lên bảng xếp hạng
import { hasDb, redis, pipeline, keyOf, hash, toObj, body, send, XP_PER_LEVEL } from './_lib/redis.js';

const SPECIES_MAX = 20;

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Chỉ hỗ trợ POST' });
  if (!hasDb()) return send(res, 503, { error: 'Bảng xếp hạng chưa được bật' });

  try {
    const b = body(req);
    const key = keyOf(b.name);
    const p = toObj(await redis('HGETALL', `p:${key}`));
    if (!p.token || !b.token || p.token !== hash(b.token)) {
      return send(res, 401, { error: 'Phiên đăng nhập không hợp lệ' });
    }

    const prevXp = Number(p.xp) || 0;
    const prevAt = Number(p.updated) || 0;
    let xp = Math.max(0, Math.floor(Number(b.xp) || 0));

    // Chống gian lận cơ bản: giới hạn XP tăng theo thời gian
    const elapsed = Math.max(1, (Date.now() - prevAt) / 1000);
    const maxGain = Math.floor(300 + elapsed * 25);
    let clamped = false;
    if (xp - prevXp > maxGain) { xp = prevXp + maxGain; clamped = true; }

    const total = Math.max(0, Math.floor(Number(b.total) || 0));
    const species = Math.min(SPECIES_MAX, Math.max(0, Math.floor(Number(b.species) || 0)));
    const level = 1 + Math.floor(xp / XP_PER_LEVEL);

    const [, , rank] = await pipeline([
      ['HSET', `p:${key}`, 'xp', xp, 'total', total, 'species', species, 'level', level, 'updated', Date.now()],
      ['ZADD', 'lb', xp, key],
      ['ZREVRANK', 'lb', key],
    ]);
    return send(res, 200, { xp, rank: rank == null ? null : rank + 1, clamped });
  } catch (e) {
    return send(res, 500, { error: 'Lỗi máy chủ, thử lại sau' });
  }
}
