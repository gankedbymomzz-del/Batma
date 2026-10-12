// ====== PHÁP KHÍ & TIỆM VÀNG MÃ — chỉnh giá, tác dụng tại đây ======
// sec: thời gian hiệu lực (giây) | max: số lượng mang tối đa
export const ITEMS = {
  bell: {
    name: 'Chuông trấn hồn', icon: '🔔', price: 40, max: 3, sec: 2.5,
    desc: 'Rung lên, mọi con ma đứng khựng lại 2,5 giây. Đồng hồ cũng dừng.',
  },
  mirror: {
    name: 'Gương bát quái', icon: '🪞', price: 50, max: 3, sec: 5,
    desc: 'Soi 5 giây: bản giả hiện nguyên hình, con thật phát sáng vàng.',
  },
  lamp: {
    name: 'Đèn dầu', icon: '🪔', price: 35, max: 3, sec: 4,
    desc: 'Thắp 4 giây: ma tàng hình không thể ẩn mình dù bạn xoay máy.',
  },
  incense: {
    name: 'Nén nhang', icon: '🕯️', price: 45, max: 3, sec: 0,
    desc: 'Thắp ngay giữa đêm để hồi 1 dương khí.',
  },
};

// Gói bùa bán trong tiệm
export const PACKS = {
  paper5: { name: '5 Bùa Giấy', price: 20, give: { paper: 5 } },
  gold1: { name: '1 Bùa Vàng', price: 30, give: { gold: 1 } },
};

const BASE_COINS = { common: 10, rare: 25, legendary: 60 };
export const coinsFor = (def, cfg) => Math.round(BASE_COINS[def.rarity] * (1 + (cfg.n - 1) * 0.1));
export const nightCoins = (n) => 30 * n;
