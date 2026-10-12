// GET /api/leaderboard?name=... — top 20 thợ săn + hạng của bạn
import { hasDb, redis, pipeline, keyOf, send } from './_lib/redis.js';

export default async function handler(req, res) {
  if (!hasDb()) return send(res, 503, { error: 'Bảng xếp hạng chưa được bật' });

  try {
    const flat = await redis('ZREVRANGE', 'lb', 0, 19, 'WITHSCORES');
    const keys = [];
    for (let i = 0; i < flat.length; i += 2) keys.push(flat[i]);

    const me = req.query?.name ? keyOf(req.query.name) : null;
    const cmds = keys.map((k) => ['HMGET', `p:${k}`, 'name', 'xp', 'level', 'species', 'total']);
    cmds.push(['ZCARD', 'lb']);
    if (me) cmds.push(['ZREVRANK', 'lb', me], ['ZSCORE', 'lb', me]);
    const out = await pipeline(cmds);

    const top = keys.map((k, i) => {
      const [name, xp, level, species, total] = out[i] || [];
      return { rank: i + 1, key: k, name: name || k, xp: Number(xp) || 0, level: Number(level) || 1, species: Number(species) || 0, total: Number(total) || 0 };
    });
    const players = out[keys.length] || 0;
    let mine = null;
    if (me) {
      const r = out[keys.length + 1];
      if (r != null) mine = { rank: r + 1, xp: Number(out[keys.length + 2]) || 0, key: me };
    }

    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');
    return send(res, 200, { top, players, me: mine });
  } catch (e) {
    return send(res, 500, { error: 'Lỗi máy chủ, thử lại sau' });
  }
}
