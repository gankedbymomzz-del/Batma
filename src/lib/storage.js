// Lưu tiến độ theo từng tên thợ săn trong trình duyệt
const PREFIX = 'san-ma-save-v2:';
const PLAYER_KEY = 'san-ma-player';
const TOKENS_KEY = 'san-ma-tokens';

export const XP_PER_LEVEL = 150;
export const MAX_HP = 3;

export const nameKey = (n) => String(n || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

export const makeDefault = () => ({
  xp: 0, total: 0, caught: {}, talismans: { paper: 20, gold: 3 }, hp: MAX_HP, nightsCleared: 0,
  coins: 0, items: { bell: 1, mirror: 0, lamp: 1, incense: 0 }, bestStreak: 0, bossBeaten: false,
  journal: [], prologueSeen: false, tutorialDone: false,
});

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } };

export function loadSave(name) {
  const d = read(PREFIX + nameKey(name));
  const base = makeDefault();
  if (!d) return base;
  return {
    ...base, ...d,
    caught: { ...(d.caught || {}) },
    talismans: { ...base.talismans, ...(d.talismans || {}) },
    items: { ...base.items, ...(d.items || {}) },
    coins: typeof d.coins === 'number' ? d.coins : 0,
    journal: Array.isArray(d.journal) ? d.journal : [],
    tutorialDone: d.tutorialDone ?? (Number(d.total) || 0) > 0, // người chơi cũ bỏ qua hướng dẫn
    hp: typeof d.hp === 'number' ? d.hp : MAX_HP,
  };
}
export const writeSave = (name, s) => write(PREFIX + nameKey(name), s);

export const loadPlayer = () => read(PLAYER_KEY);
export function savePlayer(p) {
  if (p) write(PLAYER_KEY, p);
  else { try { localStorage.removeItem(PLAYER_KEY); } catch { /* bỏ qua */ } }
}
export const getToken = (name) => (read(TOKENS_KEY) || {})[nameKey(name)] || null;
export function setToken(name, token) {
  const all = read(TOKENS_KEY) || {};
  all[nameKey(name)] = token;
  write(TOKENS_KEY, all);
}

const LITE_KEY = 'san-ma-lite';
export const loadLite = () => { try { return localStorage.getItem(LITE_KEY) === '1'; } catch { return false; } };
export const saveLite = (v) => { try { localStorage.setItem(LITE_KEY, v ? '1' : '0'); } catch { /* bỏ qua */ } };

export function levelFromXp(xp) {
  return { level: 1 + Math.floor(xp / XP_PER_LEVEL), progress: (xp % XP_PER_LEVEL) / XP_PER_LEVEL };
}
