// ====== DANH SÁCH MA — sửa/thêm ma tại đây ======
// img: ảnh nền trong suốt trong public/ghosts | ratio: cao/rộng của ảnh
// catch: tỷ lệ bắt gốc | move: độ di chuyển (bắt hụt → ma nổi điên, chỉ còn 5 giây)
// size: kích thước | xp: điểm gốc
// behavior: chiêu riêng (bật từ Đêm 3) | hint: gợi ý hiện trong Sổ Ma sau lần bắt đầu tiên

export const RARITY = {
  common: { label: 'Oán linh', color: '#9fb3c8' },
  rare: { label: 'Lệ quỷ', color: '#ff4d4d' },
  legendary: { label: 'Đại hung', color: '#ffd166' },
};

export const TALISMANS = {
  paper: { label: 'Bùa Giấy', mult: 1 },
  gold: { label: 'Bùa Vàng', mult: 1.5 },
};

// ====== TRÙM ĐÊM 7 ======
// phases: chiêu ở từng giai đoạn | times: số giây mỗi giai đoạn
export const BOSS = {
  id: 'quy-vuong', name: 'Quỷ Vương', rarity: 'legendary', boss: true,
  img: '/ghosts/oan-hon-toc-ru.webp', ratio: 1.48, glow: '#ff1a1a',
  catch: 0.3, move: 1.2, size: 1.75, xp: 600,
  phases: ['decoy', 'stealth', 'crawl'], times: [15, 13, 11],
  desc: 'Kẻ cai quản mọi oan hồn trong ngôi nhà này. Mỗi lần bị phong ấn, nó lột xác thành một hình dạng mới.',
};

export const GHOSTS = [
  {
    id: 'bong-trang-hanh-lang', name: 'Bóng Trắng Cuối Hành Lang', rarity: 'common',
    img: '/ghosts/bong-trang-hanh-lang.webp', ratio: 2.31, glow: '#dfe8ff',
    catch: 0.38, move: 1.0, size: 0.85, xp: 30,
    behavior: 'creep', hint: 'Chỉ tiến lại gần khi bạn không nhìn. Rời mắt khỏi nó, thời gian trôi gấp đôi.',
    desc: 'Chỉ là một vệt trắng cuối hành lang. Bạn chớp mắt, nó đã gần hơn một bước.',
  },
  {
    id: 'oan-hon-toc-ru', name: 'Oan Hồn Tóc Rũ', rarity: 'common',
    img: '/ghosts/oan-hon-toc-ru.webp', ratio: 1.48, glow: '#2a2a33',
    catch: 0.34, move: 0.8, size: 1.25, xp: 35,
    behavior: 'stealth', hint: 'Tàng hình khi bạn xoay máy. Giữ máy thật yên để nó hiện ra.',
    desc: 'Mái tóc ướt sũng che kín mặt. Nếu nó vén tóc lên, đừng nhìn vào mắt nó.',
  },
  {
    id: 'nu-quy-gam-tu', name: 'Nữ Quỷ Gầm Tủ', rarity: 'rare',
    img: '/ghosts/nu-quy-gam-tu.webp', ratio: 1.73, glow: '#3a3f4a',
    catch: 0.22, move: 1.3, size: 1.1, xp: 90,
    behavior: 'crawl', hint: 'Bò sát sàn nhà, lẩn dưới tầm mắt. Hạ máy xuống để tìm.',
    desc: 'Sống trong gầm tủ quần áo. Đêm nào cũng bò ra, cười khúc khích bên giường người đang ngủ.',
  },
  {
    id: 'ma-nu-cau-thang', name: 'Ma Nữ Cầu Thang', rarity: 'legendary',
    img: '/ghosts/ma-nu-cau-thang.webp', ratio: 1.87, glow: '#ff9a3c',
    catch: 0.1, move: 1.5, size: 1.15, xp: 250,
    behavior: 'decoy', hint: 'Phân thân thành 3 và liên tục đổi chỗ. Con thật có mắt sáng rực, bản giả mờ hơn.',
    desc: 'Đôi mắt rực lửa nhìn xuống từ chiếu nghỉ cầu thang. Không ai đếm được nó đã bước xuống bao nhiêu bậc.',
  },
];
