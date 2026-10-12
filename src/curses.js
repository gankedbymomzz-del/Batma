// ====== LỜI NGUYỀN GIỮA NGƯỜI CHƠI (phòng chơi chung) ======
// cost: vàng mã | race: chỉ dùng khi đang đua (máy chủ kiểm tra lại)
export const CURSES = {
  dark: { name: 'Màn đêm', icon: '🌑', cost: 20, race: true, desc: 'Màn hình đối thủ tối sầm 3 giây' },
  knock: { name: 'Gõ cửa', icon: '🚪', cost: 10, race: true, desc: 'Tiếng gõ dồn dập và rung bên tai đối thủ' },
  gift: { name: 'Tặng bùa', icon: '🎁', cost: 15, race: false, desc: 'Tặng 1 Bùa Vàng cho người chơi khác' },
};
export const CURSE_CD_MS = 12000;
export const DARK_MS = 3000;
