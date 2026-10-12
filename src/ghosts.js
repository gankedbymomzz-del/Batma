// ====== DANH SÁCH MA — sửa/thêm ma tại đây ======
// catch: tỷ lệ bắt gốc (0–1) | flee: tỷ lệ bỏ chạy khi bắt hụt
// move: độ lắc lư (càng cao càng khó ngắm) | size: kích thước | xp: điểm nhận được

export const RARITY = {
  common: { label: 'Thường', color: '#9fe8ff' },
  rare: { label: 'Hiếm', color: '#c9a2ff' },
  legendary: { label: 'Huyền thoại', color: '#ffc85c' },
};

export const TALISMANS = {
  paper: { label: 'Bùa Giấy', mult: 1 },
  gold: { label: 'Bùa Vàng', mult: 1.8 },
};

export const GHOSTS = [
  {
    id: 'thung-carton', name: 'Ma Thùng Carton', rarity: 'common', color: '#b8f0d0', prop: '📦',
    catch: 0.6, flee: 0.1, move: 0.6, size: 1, xp: 20,
    desc: 'Trốn trong thùng hàng chưa dán tem. Ai rạch băng keo là bị hù.',
  },
  {
    id: 'den-pin', name: 'Ma Đèn Pin Hết Pin', rarity: 'common', color: '#fff1a8', prop: '🔦',
    catch: 0.58, flee: 0.1, move: 0.7, size: 0.95, xp: 20,
    desc: 'Chớp tắt liên tục. Xuất hiện đúng lúc bạn cần soi kệ cao nhất.',
  },
  {
    id: 'dep-le', name: 'Ma Dép Lê', rarity: 'common', color: '#ffc6d9', prop: '🩴',
    catch: 0.6, flee: 0.12, move: 0.8, size: 0.9, xp: 20,
    desc: 'Nghe tiếng lẹt xẹt ngoài hành lang mà không thấy ai? Chính là nó.',
  },
  {
    id: 'mi-goi', name: 'Ma Mì Gói', rarity: 'common', color: '#ffd9a8', prop: '🍜',
    catch: 0.55, flee: 0.12, move: 0.7, size: 1, xp: 25,
    desc: 'Chỉ hiện ra lúc 2 giờ sáng, khi ca đêm bắt đầu thấy đói.',
  },
  {
    id: 'vali-lac', name: 'Ma Vali Lạc', rarity: 'rare', color: '#9fe8ff', prop: '🧳',
    catch: 0.36, flee: 0.2, move: 1.1, size: 1.05, xp: 60,
    desc: 'Lang thang trên băng chuyền sân bay, đi mãi vẫn chưa tìm được chủ.',
  },
  {
    id: 'don-hoan', name: 'Ma Đơn Hoàn', rarity: 'rare', color: '#c9a2ff', prop: '🔁',
    catch: 0.34, flee: 0.22, move: 1.2, size: 1, xp: 60,
    desc: 'Đi rồi lại về, về rồi lại đi. Không ai hiểu vì sao.',
  },
  {
    id: 'sai-sku', name: 'Ma Sai SKU', rarity: 'rare', color: '#a8c8ff', prop: '🏷️',
    catch: 0.35, flee: 0.2, move: 1.3, size: 0.95, xp: 65,
    desc: 'Lén đổi tem nhãn khi không ai nhìn. Kiểm kê là lòi ra ngay.',
  },
  {
    id: 'balo-huyen-thoai', name: 'Ma Balo Huyền Thoại', rarity: 'legendary', color: '#ffc85c', prop: '🎒',
    catch: 0.18, flee: 0.3, move: 1.6, size: 1.15, xp: 200,
    desc: 'Ai đeo được nó sẽ đi khắp năm châu mà không cần hành lý ký gửi.',
  },
  {
    id: 'vua-cao-diem', name: 'Vua Ma Giờ Cao Điểm', rarity: 'legendary', color: '#ff9a7a', prop: '⚡',
    catch: 0.15, flee: 0.32, move: 1.8, size: 1.2, xp: 250,
    desc: 'Chỉ thức dậy vào mùa sale 11.11. Mỗi bước đi là một ngàn đơn hàng.',
  },
];

// Chọn ma theo độ hiếm. Cấp càng cao, ma hiếm càng dễ gặp.
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
