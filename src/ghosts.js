// ====== DANH SÁCH MA — sửa/thêm ma tại đây ======
// img: ảnh nền trong suốt trong public/ghosts | ratio: cao/rộng của ảnh
// catch: tỷ lệ bắt gốc | flee: tỷ lệ bỏ chạy khi bắt hụt | move: độ di chuyển
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
    id: 'quy-khau-mat', name: 'Quỷ Khâu Mắt', rarity: 'common',
    img: '/ghosts/quy-khau-mat.webp', ratio: 2.05, glow: '#3d4b5c',
    catch: 0.55, flee: 0.12, move: 1.1, size: 1, xp: 30, patience: 20,
    desc: 'Kẻ mù quáng bị khâu chằng chịt mắt và miệng. Bò trườn trong hẻm tối, lần theo tiếng thở của bạn.',
  },
  {
    id: 'oan-nhi-tam-mau', name: 'Oán Nhi Tầm Mẫu', rarity: 'common',
    img: '/ghosts/oan-nhi-tam-mau.webp', ratio: 1.81, glow: '#8a5cc7',
    catch: 0.5, flee: 0.15, move: 0.9, size: 0.95, xp: 35, patience: 18,
    desc: 'Quái thai bò bằng bốn chi, từ bụng thò ra vô số cánh tay nhỏ. Đêm đêm khóc ré đi tìm mẹ.',
  },
  {
    id: 'xa-dien-huyet-nu', name: 'Xà Diện Huyết Nữ', rarity: 'rare',
    img: '/ghosts/xa-dien-huyet-nu.webp', ratio: 2.29, glow: '#d42a2a',
    catch: 0.34, flee: 0.22, move: 1.2, size: 1.05, xp: 80, patience: 15,
    desc: 'Cô dâu mặc hỷ phục đỏ, không còn da mặt. Vừa chải tóc vừa hỏi người qua đường: "Ta có đẹp không?"',
  },
  {
    id: 'thi-cot-moc-nhan', name: 'Thi Cốt Mộc Nhân', rarity: 'rare',
    img: '/ghosts/thi-cot-moc-nhan.webp', ratio: 2.16, glow: '#5f7d4f',
    catch: 0.32, flee: 0.24, move: 0.6, size: 1.15, xp: 90, patience: 16,
    desc: 'Xác chết bị rễ cây đa cổ thụ đâm xuyên. Đứng im như gốc cây, chỉ cần bạn quay lưng là nó tiến lại gần.',
  },
  {
    id: 'da-xoa-nghin-mat', name: 'Dạ Xoa Nghìn Mặt', rarity: 'legendary',
    img: '/ghosts/da-xoa-nghin-mat.webp', ratio: 2.0, glow: '#e8dcc8',
    catch: 0.16, flee: 0.3, move: 1.5, size: 1.2, xp: 250, patience: 12,
    desc: 'Thực thể khoác áo liệm trắng, bên trong nhung nhúc hàng trăm gương mặt biến dạng đang gào thét.',
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
