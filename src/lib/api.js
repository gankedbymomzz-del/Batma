// Gọi API bảng xếp hạng (Vercel Functions trong thư mục /api)
async function call(path, opts = {}) {
  let r;
  try {
    r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json' } });
  } catch {
    throw Object.assign(new Error('Không kết nối được máy chủ'), { status: 0 });
  }
  let data = null;
  try { data = await r.json(); } catch { /* không phải JSON */ }
  if (!r.ok || !data) {
    throw Object.assign(new Error(data?.error || 'Bảng xếp hạng chưa được bật'), { status: r.ok ? 503 : r.status });
  }
  return data;
}

export const api = {
  register: (name, token) => call('/api/register', { method: 'POST', body: JSON.stringify({ name, token }) }),
  score: (payload) => call('/api/score', { method: 'POST', body: JSON.stringify(payload) }),
  leaderboard: (name) => call(`/api/leaderboard${name ? `?name=${encodeURIComponent(name)}` : ''}`),
};
