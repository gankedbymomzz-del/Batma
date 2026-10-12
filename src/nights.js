import { GHOSTS } from './ghosts.js';

// ====== CẤU HÌNH TỪNG ĐÊM — chỉnh độ khó tại đây ======
// quota: số ma cần phong ấn | catchSec: giây để bắt mỗi con | rate: hệ số tỷ lệ bắt
// speed: hệ số tốc độ ma | tiers: độ hiếm được xuất hiện | behaviors: bật chiêu riêng
// multi: số ma tối đa cùng lúc | decoys: ma Lệ quỷ trở lên có bản giả
const BASE = [
  { quota: 3, catchSec: 10, rate: 1, speed: 1, tiers: ['common'], behaviors: false, multi: 1, decoys: false,
    intro: 'Đêm đầu tiên. Phong ấn 3 oan hồn trước khi trời sáng.' },
  { quota: 4, catchSec: 9, rate: 0.9, speed: 1.05, tiers: ['common', 'rare'], behaviors: false, multi: 1, decoys: false,
    intro: 'Âm khí nặng hơn. Lệ quỷ bắt đầu xuất hiện.' },
  { quota: 5, catchSec: 8, rate: 0.85, speed: 1.1, tiers: ['common', 'rare'], behaviors: true, multi: 1, decoys: false,
    intro: 'Từ đêm nay, mỗi oan hồn có một chiêu riêng. Bắt được con nào, chiêu của nó sẽ ghi vào Sổ Ma.' },
  { quota: 5, catchSec: 8, rate: 0.8, speed: 1.15, tiers: ['common', 'rare'], behaviors: true, multi: 2, decoys: false,
    intro: 'Chúng không còn đi một mình. Có thể có 2 con cùng lúc.' },
  { quota: 6, catchSec: 7, rate: 0.75, speed: 1.2, tiers: ['common', 'rare'], behaviors: true, multi: 2, decoys: true,
    intro: 'Cẩn thận ma giả. Ném nhầm là mất bùa và mất thêm 1 giây.' },
  { quota: 6, catchSec: 6, rate: 0.7, speed: 1.3, tiers: ['common', 'rare', 'legendary'], behaviors: true, multi: 2, decoys: true,
    intro: 'Đại hung đã thức giấc. Mỗi lần chạm trán chỉ còn 6 giây.' },
];

export const NIGHT_COUNT = BASE.length;
export const BOSS_NIGHT = 7;            // đêm trùm
export const STORY_NIGHTS = BOSS_NIGHT; // sau đêm này là Đêm vô tận

export function getNight(n) {
  if (n <= BASE.length) return { n, ...BASE[n - 1] };
  if (n === BOSS_NIGHT) {
    return {
      n, boss: true, quota: 1, catchSec: 15, rate: 0.7, speed: 1.3, tiers: ['legendary'],
      behaviors: true, multi: 1, decoys: false,
      intro: 'Đêm thứ bảy. Kẻ cai quản lũ oan hồn sẽ xuất hiện. Phải phong ấn nó 3 lần, mỗi lần nó lại đổi hình dạng.',
    };
  }
  // Đêm vô tận: mỗi đêm khó hơn đêm trước
  const k = n - BOSS_NIGHT;
  return {
    n,
    quota: 6 + Math.min(k, 6),
    catchSec: Math.max(4.5, 6 - k * 0.3),
    rate: Math.max(0.45, 0.7 - k * 0.04),
    speed: 1.3 + k * 0.05,
    tiers: ['common', 'rare', 'legendary'],
    behaviors: true, multi: 2, decoys: true,
    intro: 'Đêm vô tận. Mỗi đêm khó hơn đêm trước. Bạn trụ được bao lâu?',
  };
}

export function pickGhost(cfg, omen = { legendaryMult: 1 }, rng = Math.random) {
  const extra = Math.max(0, cfg.n - BOSS_NIGHT) * 2;
  const weights = { common: 60, rare: 32, legendary: (10 + extra) * omen.legendaryMult };
  const tiers = cfg.tiers;
  const total = tiers.reduce((a, t) => a + weights[t], 0);
  let roll = rng() * total;
  let tier = tiers[0];
  for (const t of tiers) { roll -= weights[t]; if (roll <= 0) { tier = t; break; } }
  const pool = GHOSTS.filter((g) => g.rarity === tier);
  return pool[Math.floor(rng() * pool.length)];
}

// ====== MÀN ĐUA TRONG PHÒNG CHƠI CHUNG ======
export const RACE_CFG = {
  n: 3, race: true, quota: 5, catchSec: 9, rate: 0.85, speed: 1.1,
  tiers: ['common', 'rare'], behaviors: true, multi: 1, decoys: false,
};

// Bộ sinh số ngẫu nhiên có hạt giống: mọi máy trong phòng gặp cùng một chuỗi ma
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// XP tăng theo đêm
export const xpFor = (def, cfg) => Math.round(def.xp * (1 + (cfg.n - 1) * 0.15));
