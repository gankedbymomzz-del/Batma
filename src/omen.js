// ====== GIỜ THẬT: Giờ Tý & Đêm trăng máu — đọc theo giờ trên điện thoại ======
export const NO_OMEN = { active: false, xpMult: 1, coinMult: 1, speedMult: 1, legendaryMult: 1, tags: [] };

export function getOmen(d = new Date()) {
  const h = d.getHours();
  const day = d.getDay(); // 0 = Chủ nhật, 6 = Thứ bảy
  const o = { ...NO_OMEN, tags: [] };
  if (h >= 23 || h < 3) {
    o.legendaryMult *= 2; o.xpMult *= 1.25; o.speedMult *= 1.05;
    o.tags.push({ id: 'witching', label: 'Giờ Tý', desc: 'Âm khí cực thịnh: Đại hung xuất hiện gấp đôi, XP ×1,25.' });
  }
  if ((day === 6 && h >= 18) || (day === 0 && h < 4)) {
    o.xpMult *= 1.5; o.coinMult *= 1.5; o.speedMult *= 1.1;
    o.tags.push({ id: 'blood', label: 'Đêm trăng máu', desc: 'Tối thứ bảy: XP và vàng mã ×1,5, ma hung hơn.' });
  }
  o.active = o.tags.length > 0;
  return o;
}
