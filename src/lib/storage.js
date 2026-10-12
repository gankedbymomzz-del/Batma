// Lưu tiến độ vào trình duyệt (localStorage)
const KEY = 'san-ma-save-v1';
export const XP_PER_LEVEL = 150;

export const makeDefault = () => ({ xp: 0, total: 0, caught: {}, talismans: { paper: 20, gold: 3 } });

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return makeDefault();
    const d = JSON.parse(raw);
    const base = makeDefault();
    return { ...base, ...d, caught: { ...(d.caught || {}) }, talismans: { ...base.talismans, ...(d.talismans || {}) } };
  } catch {
    return makeDefault();
  }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bỏ qua */ }
}

export function levelFromXp(xp) {
  return { level: 1 + Math.floor(xp / XP_PER_LEVEL), progress: (xp % XP_PER_LEVEL) / XP_PER_LEVEL };
}
