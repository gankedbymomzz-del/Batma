// ====== DANH SÁCH MA — sửa/thêm ma tại đây ======
// img: ảnh nền trong suốt trong public/ghosts | ratio: cao/rộng của ảnh
// catch: tỷ lệ bắt gốc | move: độ di chuyển (bắt hụt → ma nổi điên, chỉ còn 5 giây)
// size: kích thước | xp: điểm | patience: số giây trước khi ma lao tới tấn công

export const RARITY = {
  common: { label: 'Oán linh', color: '#9fb3c8' },
  rare: { label: 'Lệ quỷ', color: '#ff4d4d' },
  legendary: { label: 'Đại hung', color: '#ffd166' },
};

export const TALISMANS = {
  paper: { label: 'Bùa Giấy', mult: 1 },
  gold: { label: 'Bùa Vàng', mult: 1.8 },
};

export const GHOSTS = [
  {
    id: 'bong-trang-hanh-lang', name: 'Bóng Trắng Cuối Hành Lang', rarity: 'common',
    img: '/ghosts/bong-trang-hanh-lang.webp', ratio: 2.31, glow: '#dfe8ff',
    catch: 0.55, move: 1.0, size: 0.85, xp: 30, patience: 20,
    desc: 'Chỉ là một vệt trắng cuối hành lang. Bạn chớp mắt, nó đã gần hơn một bước.',
  },
  {
    id: 'oan-hon-toc-ru', name: 'Oan Hồn Tóc Rũ', rarity: 'common',
    img: '/ghosts/oan-hon-toc-ru.webp', ratio: 1.48, glow: '#2a2a33',
    catch: 0.5, move: 0.7, size: 1.25, xp: 35, patience: 18,
    desc: 'Mái tóc ướt sũng che kín mặt. Nếu nó vén tóc lên, đừng nhìn vào mắt nó.',
  },
  {
    id: 'nu-quy-gam-tu', name: 'Nữ Quỷ Gầm Tủ', rarity: 'rare',
    img: '/ghosts/nu-quy-gam-tu.webp', ratio: 1.73, glow: '#3a3f4a',
    catch: 0.33, move: 1.3, size: 1.1, xp: 90, patience: 15,
    desc: 'Sống trong gầm tủ quần áo. Đêm nào cũng bò ra, cười khúc khích bên giường người đang ngủ.',
  },
  {
    id: 'ma-nu-cau-thang', name: 'Ma Nữ Cầu Thang', rarity: 'legendary',
    img: '/ghosts/ma-nu-cau-thang.webp', ratio: 1.87, glow: '#ff9a3c',
    catch: 0.16, move: 1.5, size: 1.15, xp: 250, patience: 12,
    desc: 'Đôi mắt rực lửa nhìn xuống từ chiếu nghỉ cầu thang. Không ai đếm được nó đã bước xuống bao nhiêu bậc.',
  },
];

// Chọn ma theo độ hiếm. Cấp càng cao, ma hung càng dễ gặp.
export function pickGhost(level = 1) {
  const bonus = Math.min(level - 1, 10);
  const weights = { common: 62 - bonus * 2.5, rare: 30 + bonus * 1.5, legendary: 8 + bonus };
  const total = weights.common + weights.rare + weights.legendary;
  let roll = Math.random() * total;
  let tier = 'common';
  for (const k of ['common', 'rare', 'legendary']) {
    roll -= weights[k];
    if (roll <= 0) { tier = k; break; }
  }
  const pool = GHOSTS.filter((g) => g.rarity === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}
