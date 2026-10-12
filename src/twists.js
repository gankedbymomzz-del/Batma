// ====== MANH MỐI MÀN ĐUA — mỗi đáp án mật thư thay đổi luật màn đua ======
// cfg: ghi đè cấu hình màn đua | prefer: ưu tiên ma có chiêu này (70%)
// spawn: vị trí ma xuất hiện | label + hint: hiện cho cả phòng trước khi đua
export const TWISTS = {
  low: {
    label: 'Từ đáy giếng', hint: 'Ma trồi lên từ dưới thấp. Hạ máy xuống mà tìm.',
    spawn: 'low',
  },
  behind: {
    label: 'Cửa sau', hint: 'Ma luôn xuất hiện sau lưng bạn. Quay người lại!',
    spawn: 'behind',
  },
  crawler: {
    label: 'Trong tủ áo', hint: 'Phần lớn là Nữ Quỷ bò sát sàn.',
    prefer: 'crawl',
  },
  creep: {
    label: 'Trốn tìm', hint: 'Như đứa trẻ chơi trốn tìm: ma chỉ tiến lại khi bạn quay đi.',
    prefer: 'creep',
  },
  witching: {
    label: 'Giờ Tý', hint: 'Âm khí cực thịnh: Đại hung có thể xuất hiện, XP ×1,25.',
    cfg: { tiers: ['common', 'rare', 'legendary'] }, omen: { xpMult: 1.25, legendaryMult: 2 },
  },
  dark: {
    label: 'Tầng hầm', hint: 'Tối om. Phần lớn ma tàng hình, giữ máy thật yên.',
    prefer: 'stealth', dark: true,
  },
  sector: {
    label: 'Hướng Tây Bắc', hint: 'Mọi con ma đến từ cùng một hướng. Tìm được con đầu là biết chỗ.',
    spawn: 'sector',
  },
  mirror: {
    label: 'Gương tân hôn', hint: 'Con ma nào cũng có bản giả. Ném nhầm mất bùa và 1 giây.',
    cfg: { decoys: true }, decoyAll: true,
  },
  incense: {
    label: 'Bàn thờ', hint: 'Hương khói che chở: ai cũng được tặng 1 nén nhang, dễ bắt hơn 10%.',
    cfg: { rate: 0.85 * 1.1 }, gift: 'incense',
  },
  gate: {
    label: 'Quỷ Môn mở', hint: 'Ma chạy nhanh hơn, mỗi con chỉ còn 7 giây.',
    cfg: { speed: 1.35, catchSec: 7 },
  },
  pairs: {
    label: 'Sinh sôi', hint: 'Ma đến từng cặp, có lúc 2 con cùng lúc.',
    cfg: { multi: 2 },
  },
  steps: {
    label: 'Mười lăm bậc', hint: 'Mỗi con bạn bắt được, con sau lại nhanh hơn.',
    stepUp: 0.1,
  },
};
