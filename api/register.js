// POST /api/register { name, token? } — ghi danh bằng tên, trả về token bí mật
import crypto from 'node:crypto';
import { hasDb, redis, pipeline, NAME_RE, cleanName, keyOf, hash, toObj, body, send } from './_lib/redis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Chỉ hỗ trợ POST' });
  if (!hasDb()) return send(res, 503, { error: 'Bảng xếp hạng chưa được bật' });

  try {
    const { name, token } = body(req);
    const clean = cleanName(name);
    if (!NAME_RE.test(clean)) {
      return send(res, 400, { error: 'Tên dài 2–16 ký tự, chỉ gồm chữ, số và khoảng trắng' });
    }
    const key = keyOf(clean);
    const existing = toObj(await redis('HGETALL', `p:${key}`));

    if (existing.token) {
      if (token && existing.token === hash(token)) {
        return send(res, 200, { name: existing.name, token, xp: Number(existing.xp) || 0 });
      }
      return send(res, 409, { error: 'Tên này đã có thợ săn khác dùng, hãy chọn tên khác' });
    }

    const newToken = crypto.randomUUID();
    const claimed = await redis('HSETNX', `p:${key}`, 'token', hash(newToken));
    if (!claimed) return send(res, 409, { error: 'Tên này vừa có người lấy, hãy chọn tên khác' });

    await pipeline([
      ['HSET', `p:${key}`, 'name', clean, 'xp', 0, 'total', 0, 'species', 0, 'level', 1, 'updated', Date.now()],
      ['ZADD', 'lb', 0, key],
    ]);
    return send(res, 200, { name: clean, token: newToken, xp: 0 });
  } catch (e) {
    return send(res, 500, { error: 'Lỗi máy chủ, thử lại sau' });
  }
}
