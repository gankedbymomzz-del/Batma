// ====== CỐT TRUYỆN "HỒ SƠ NHÀ SỐ 7" ======
// Chơi đơn: lời mở đầu → lời dẫn mỗi đêm → nhật ký mở khi qua đêm → lai lịch ma khi bắt đủ.
// Khớp với 12 mật thư trong chế độ phòng (api/_lib/puzzles.js).

export const PROLOGUE = {
  title: 'Hồ sơ nhà số 7',
  paragraphs: [
    'Một phong thư không tên được nhét dưới cửa nhà bạn lúc nửa đêm. Giấy vàng, mực đỏ, nét chữ run run:',
    '“Nhà số 7, cuối hẻm Quỷ Môn. Bảy người đã biến mất trong bảy đêm. Không ai dám bước vào nữa. Xin thầy hãy giải thoát cho họ.”',
    'Bạn là thầy pháp cuối cùng còn nhận việc. Trong túi chỉ có một xấp bùa, một chiếc chuông đồng và một ngọn đèn dầu.',
    'Cánh cổng sắt tự mở khi bạn vừa chạm tay vào.',
  ],
  button: 'Bước vào',
};

// Lời dẫn mở đầu từng đêm + trang nhật ký nhặt được khi qua đêm
export const NIGHT_STORY = {
  1: {
    intro: 'Mùi nhang cũ và ẩm mốc xộc lên. Trên bàn thờ phòng khách, bảy di ảnh xếp thành hàng, nhưng chỉ sáu tấm có mặt người. Tấm thứ bảy để trống.',
    journal: {
      title: 'Trang nhật ký ướt sũng', author: 'Thị Lành, cô hầu gái',
      text: 'Ngày mùng 3 tháng 7. Ông chủ bắt tôi xuống lau thành giếng sau vườn lúc nửa đêm. Ông nói dưới đáy giếng có tiếng người gọi tên tôi. Tôi không dám nhìn xuống. Nhưng tiếng gọi ấy… giống hệt giọng mẹ tôi.',
    },
  },
  2: {
    intro: 'Bước chân bạn để lại dấu trên lớp bụi dày. Nhưng ở cuối hành lang có những dấu chân khác, nhỏ hơn, ướt sũng, đang đi về phía bạn.',
    journal: {
      title: 'Mảnh giấy kẹp trong tủ áo', author: 'Bin, cậu con trai út',
      text: 'Mẹ dặn con trốn trong tủ, đếm đến một trăm mới được ra. Con đếm đến một trăm rồi. Mười lần rồi. Sao mẹ chưa gọi con? Ngoài kia có ai đó cứ gõ cửa tủ, mà không phải mẹ.',
    },
  },
  3: {
    intro: 'Đêm nay chúng bắt đầu thay đổi. Mỗi oan hồn mang theo nỗi ám ảnh lúc chết: kẻ chỉ dám nhúc nhích khi không ai nhìn, kẻ giấu mặt sau mái tóc, kẻ bò dưới gầm giường.',
    journal: {
      title: 'Lá thư chưa kịp gửi', author: 'Bà chủ nhà',
      text: 'Tôi đang mang thai đứa thứ ba. Chồng tôi nói ngôi nhà cần “một linh hồn chưa kịp chào đời” mới đủ lễ. Tôi phải đưa các con đi trước đêm trăng tròn. Bin ơi, mẹ sẽ quay lại tìm con. Mẹ hứa.',
    },
  },
  4: {
    intro: 'Chúng không còn đi một mình. Tiếng thì thầm vang lên từ hai phía cùng lúc, và lần này chúng gọi đúng tên bạn.',
    journal: {
      title: 'Thiệp cưới cháy xém', author: 'Hạnh, con gái lớn',
      text: 'Cha gả tôi vào đúng đêm trăng máu. Ông nói đó là ngày lành. Trong gương phòng tân hôn, tôi thấy một người đứng sau lưng mình. Không phải chú rể. Người đó mỉm cười, và tôi nhận ra nụ cười của cha.',
    },
  },
  5: {
    intro: 'Gương trong nhà bắt đầu nói dối. Có những bóng hình giống hệt nhau, nhưng chỉ một trong số đó là thật. Phần còn lại chỉ chờ bạn ném nhầm.',
    journal: {
      title: 'Trang sổ địa lý', author: 'Thầy địa lý họ Phan',
      text: 'Tôi đã cảnh báo hắn: mảnh đất này nằm đúng trên Quỷ Môn. Hắn trả tôi gấp mười để im lặng, rồi bắt tôi vẽ trận đồ ngược, mở cửa thay vì trấn cửa. Xin trời đất tha tội cho tôi. Tôi sẽ không rời khỏi căn nhà này được nữa.',
    },
  },
  6: {
    intro: 'Lá bùa trấn trạch ở góc Tây Bắc đã bị xé đôi. Thứ cai quản ngôi nhà đã tỉnh giấc. Nó biết bạn đang ở đây, và nó không vội.',
    journal: {
      title: 'Sổ tay bìa da', author: 'Ông chủ nhà số 7',
      text: 'Sáu linh hồn đã đủ: con hầu, mẹ già, thằng thầy địa lý, vợ, con gái, thằng út. Chỉ cần một người nữa ngồi vào chiếc ghế thứ bảy dưới tầng hầm, Quỷ Môn sẽ mở và ta sẽ không bao giờ chết. Ta đã viết thư mời một thầy pháp.',
    },
  },
  7: {
    intro: 'Bạn hiểu ra rồi. Lá thư mời bạn đến chính là của hắn. Tấm di ảnh thứ bảy để trống là dành cho bạn. Dưới tầng hầm, Quỷ Vương, kẻ từng là chủ ngôi nhà này, đang ngồi đợi.',
    journal: {
      title: 'Trang cuối', author: 'Không đề tên',
      text: 'Khi lá bùa cuối cùng dán lên trán Quỷ Vương, Quỷ Môn rung chuyển rồi khép lại. Sáu oan hồn đứng quanh bạn, lần đầu tiên không còn đáng sợ. Họ cúi đầu cảm ơn, rồi tan vào ánh bình minh. Nhưng dưới tầng hầm, chiếc ghế thứ bảy vẫn còn đó. Và ai đó vừa kéo nó ra.',
    },
  },
};

export const ENDLESS_INTRO = 'Quỷ Môn đã khép, nhưng chưa bao giờ khép hẳn. Mỗi đêm lại có thứ gì đó lọt qua khe cửa.';
export const STORY_PAGES = Object.keys(NIGHT_STORY).length;

// Lai lịch ma: mở khoá sau khi phong ấn đủ LORE_NEED lần
export const LORE_NEED = 3;
export const LORE = {
  'bong-trang-hanh-lang': {
    who: 'Thị Lành, cô hầu gái',
    text: 'Bị đẩy xuống giếng trong đêm đầu tiên. Cả đời làm lụng không ai để ý, đến khi chết vẫn chỉ muốn được người ta nhìn thấy. Vì thế khi bạn nhìn nó, nó đứng yên như đang chờ ai gọi tên mình.',
  },
  'oan-hon-toc-ru': {
    who: 'Hạnh, con gái lớn',
    text: 'Chết trong đêm tân hôn trước tấm gương phòng cưới. Nàng xoã tóc che kín mặt vì không muốn thấy lại gương mặt mình trong gương. Ai xoay người vội vã, nàng lẩn đi như chưa từng ở đó.',
  },
  'nu-quy-gam-tu': {
    who: 'Bà chủ nhà, người mẹ',
    text: 'Đã hứa quay lại tìm cậu út trốn trong tủ, nhưng không bao giờ về kịp. Giờ bà bò khắp gầm giường, gầm tủ, lục tìm đứa con mà bà không còn nhớ mặt.',
  },
  'be-gai-ao-trang': {
    who: 'Bé Na, con gái cô hầu Thị Lành',
    text: 'Ông chủ không tính con bé vào sáu linh hồn, vì với ông, con của kẻ ăn người ở không đáng gọi là người nhà. Bé Na chết cùng đêm với mẹ, gào gọi mẹ đến khàn tiếng. Giờ nó chỉ còn biết thét.',
  },
  'mat-quy-trong-suong': {
    who: 'Thầy địa lý họ Phan',
    text: 'Kẻ đã vẽ trận đồ ngược để mở Quỷ Môn. Hắn bị chính trận pháp của mình giam lại, thân xác tan thành sương, chỉ còn gương mặt gào thét mỗi khi sương tụ lại.',
  },
  'quy-nanh-mat-trang': {
    who: 'Chú rể của cô Hạnh',
    text: 'Không có tên trong sổ tay của ông chủ, vì hắn chưa bao giờ coi chàng là người nhà. Chàng bị dùng làm vật tế phụ ngay đêm tân hôn. Cơn đói của Quỷ Môn biến chàng thành thứ chỉ biết vồ lấy người sống.',
  },
  'ma-nu-cau-thang': {
    who: 'Bà Tư, mẹ của ông chủ nhà',
    text: 'Người đầu tiên phát hiện kế hoạch của con trai, bị chính nó đẩy ngã từ chiếu nghỉ cầu thang. Đôi mắt rực lửa ấy là mối hận của một người mẹ, chia làm ba để không ai đoán được bà sẽ đứng ở đâu.',
  },
};
