// Kết nối Upstash Redis qua REST — Vercel tự gắn biến môi trường khi bạn kết nối database
import crypto from 'node:crypto';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasDb = () => Boolean(URL_ && TOKEN);

const headers = () => ({ Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' });

export async function redis(...cmd) {
  const r = await fetch(URL_, { method: 'POST', headers: headers(), body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export async function pipeline(cmds) {
  if (!cmds.length) return [];
  const r = await fetch(`${URL_}/pipeline`, { method: 'POST', headers: headers(), body: JSON.stringify(cmds) });
  const j = await r.json();
  return j.map((x) => x.result);
}

export const NAME_RE = /^[\p{L}\p{N} _.-]{2,16}$/u;
export const cleanName = (n) => String(n || '').normalize('NFC').trim().replace(/\s+/g, ' ');
export const keyOf = (n) => cleanName(n).toLowerCase();
export const hash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
export const XP_PER_LEVEL = 150;

export const toObj = (arr) => {
  const o = {};
  for (let i = 0; i < (arr || []).length; i += 2) o[arr[i]] = arr[i + 1];
  return o;
};

export function body(req) {
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body || {};
}

export const send = (res, status, data) => res.status(status).json(data);
