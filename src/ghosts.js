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
    id: 'be-gai-ao-trang', name: 'Bé Gái Áo Trắng', rarity: 'common',
    img: '/ghosts/be-gai-ao-trang.webp', ratio: 1.55, glow: '#c8d4dc',
    catch: 0.36, move: 0.9, size: 1.0, xp: 35,
    behavior: 'wail', hint: 'Thỉnh thoảng thét lên. Bùa ném vào lúc nó thét sẽ bị hất văng, hãy chờ nó im rồi ném.',
    desc: 'Đứng im giữa phòng, áo trắng lấm lem. Chỉ cần bạn bước lại gần, nó há miệng thét lên không thành tiếng.',
  },
  {
    id: 'mat-quy-trong-suong', name: 'Mặt Quỷ Trong Sương', rarity: 'rare',
    img: '/ghosts/mat-quy-trong-suong.webp', ratio: 1.52, glow: '#9aa3ad',
    catch: 0.24, move: 1.0, size: 1.1, xp: 85,
    behavior: 'fog', hint: 'Tan vào sương rồi hiện lại theo nhịp. Chỉ ném trúng lúc nó hiện rõ. Đèn dầu giữ nó không tan được.',
    desc: 'Một gương mặt méo mó gào thét giữa làn sương. Sương tan thì mặt cũng tan, sương tụ lại thì nó đã ở gần hơn.',
  },
  {
    id: 'nu-quy-gam-tu', name: 'Nữ Quỷ Gầm Tủ', rarity: 'rare',
    img: '/ghosts/nu-quy-gam-tu.webp', ratio: 1.73, glow: '#3a3f4a',
    catch: 0.22, move: 1.3, size: 1.1, xp: 90,
    behavior: 'crawl', hint: 'Bò sát sàn nhà, lẩn dưới tầm mắt. Hạ máy xuống để tìm.',
    desc: 'Sống trong gầm tủ quần áo. Đêm nào cũng bò ra, cười khúc khích bên giường người đang ngủ.',
  },
  {
    id: 'quy-nanh-mat-trang', name: 'Quỷ Nanh Mắt Trắng', rarity: 'legendary',
    img: '/ghosts/quy-nanh-mat-trang.webp', ratio: 1.12, glow: '#e8ecf0',
    catch: 0.12, move: 1.3, size: 1.2, xp: 230,
    behavior: 'lunge', hint: 'Định kỳ lao vồ tới mặt bạn rồi lùi lại. Lúc lao tới nó to và dễ trúng, nhưng để nó vồ trúng là mất 1,5 giây.',
    desc: 'Đôi mắt trắng dã không có con ngươi, hàm răng nhọn hoắt. Nó không đi, nó vồ.',
  },
  {
    id: 'ma-nu-cau-thang', name: 'Ma Nữ Cầu Thang', rarity: 'legendary',
    img: '/ghosts/ma-nu-cau-thang.webp', ratio: 1.87, glow: '#ff9a3c',
    catch: 0.1, move: 1.5, size: 1.15, xp: 250,
    behavior: 'decoy', hint: 'Phân thân thành 3 và liên tục đổi chỗ. Con thật có mắt sáng rực, bản giả mờ hơn.',
    desc: 'Đôi mắt rực lửa nhìn xuống từ chiếu nghỉ cầu thang. Không ai đếm được nó đã bước xuống bao nhiêu bậc.',
  },
];
