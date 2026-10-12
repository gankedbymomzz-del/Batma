// ====== BỘ MẬT THƯ "HỒ SƠ NHÀ SỐ 7" ======
// Để ở máy chủ: người chơi không xem được đáp án trong mã nguồn trình duyệt.
// style: cách hiển thị | lines: nội dung mật thư | hints: 2 gợi ý mở dần
// answers: các đáp án được chấp nhận (không dấu, không cách, không phân biệt hoa thường)
// display: đáp án hiện cho cả phòng | reveal: mẩu truyện mở ra sau khi giải
// twist: manh mối thay đổi luật màn đua (xem src/twists.js)

export const PUZZLES = [
  {
    title: 'Lá thư soi gương',
    story: 'Trên bàn trang điểm có một mảnh giấy. Chữ viết lạ lùng như chỉ dành cho người đứng trong gương.',
    style: 'mirror',
    lines: ['Đừng tìm tôi trên lầu.', 'Tôi ở dưới đáy giếng', 'sau vườn.'],
    question: 'Nạn nhân thứ nhất đang ở đâu?',
    hints: ['Chữ bị lật ngược trái phải, như khi soi gương.', 'Đọc từ phải sang trái, đáp án là một nơi chứa nước.'],
    answers: ['GIENG', 'DAYGIENG', 'DUOIGIENG', 'DUOIDAYGIENG', 'GIENGSAUVUON', 'DAYGIENGSAUVUON'],
    display: 'Đáy giếng sau vườn',
    twist: 'low',
    reveal: 'Người đầu tiên mất tích là cô hầu gái. Không ai dám thả gàu xuống giếng từ đêm đó.',
  },
  {
    title: 'Ổ khoá dịch chữ',
    story: 'Cánh cửa gỗ khắc một dòng chữ vô nghĩa, bên dưới có ghi chú: "Mỗi chữ cái đã bị đẩy lên 3 bậc."',
    style: 'mono',
    lines: ['F X D   V D X'],
    question: 'Lối thoát duy nhất là gì?',
    hints: ['Lùi mỗi chữ cái về 3 bậc trong bảng chữ cái: D thành A, E thành B…', 'F → C, X → U, D → A. Đáp án gồm 2 từ, chỉ một cánh cửa.'],
    answers: ['CUASAU'],
    display: 'Cửa sau',
    twist: 'behind',
    reveal: 'Cửa sau đã bị đóng đinh từ bên ngoài. Ai đó không muốn những người trong nhà thoát ra.',
  },
  {
    title: 'Tiếng gõ trong tủ',
    story: 'Nửa đêm, từ trong tủ quần áo vang lên tiếng gõ dài ngắn đều đặn. Bên cạnh tủ có tờ giấy chép dở bảng mã.',
    style: 'morse',
    lines: ['– · – ·   /   · · –   /   · · –'],
    question: 'Người trong tủ đang gõ chữ gì?',
    hints: ['Bảng mã: A ·–   C –·–·   M ––   O –––   T –   U ··–', 'Ba chữ cái, ghép lại là lời kêu gọi giúp đỡ.'],
    answers: ['CUU', 'CUUTOI'],
    display: 'CỨU',
    twist: 'crawler',
    reveal: 'Đứa con trai út trốn trong tủ suốt ba ngày. Khi người ta mở cửa tủ, bên trong chỉ còn lại tiếng cười khúc khích.',
  },
  {
    title: 'Dãy số trên tường',
    story: 'Ai đó dùng than vẽ lên tường phòng trẻ con một dãy số. Nét chữ run run như của một đứa bé.',
    style: 'big',
    lines: ['20 · 9 · 13', '13 · 5'],
    question: 'Đứa trẻ muốn làm gì?',
    hints: ['Mỗi số là một chữ cái theo thứ tự: A = 1, B = 2, C = 3…', '20 = T. Đáp án gồm 2 từ, đứa trẻ đang tìm một người thân.'],
    answers: ['TIMME'],
    display: 'Tìm mẹ',
    twist: 'creep',
    reveal: 'Đứa bé chưa kịp chào đời đã cùng mẹ nằm xuống. Từ đó, đêm nào cũng có tiếng bò trườn tìm mẹ trong nhà.',
  },
  {
    title: 'Chiếc đồng hồ chết',
    story: 'Đồng hồ quả lắc trong phòng khách đã ngừng chạy. Cuốn sổ cạnh đó ghi: "Hai kim chập làm một, ngay sau 11 giờ đêm, là lúc người cuối cùng biến mất."',
    style: 'big',
    lines: ['XI ··· ?'],
    question: 'Đồng hồ dừng lúc mấy giờ?',
    hints: ['Kim giờ và kim phút chỉ trùng nhau 11 lần mỗi 12 tiếng.', 'Sau 11 giờ đêm, lần trùng nhau tiếp theo là đúng lúc chuyển sang ngày mới.'],
    answers: ['12', '12GIO', '0', '0GIO', '24', '24GIO', 'NUADEM', '12GIODEM', 'GIOTY'],
    display: '12 giờ đêm (Giờ Tý)',
    twist: 'witching',
    reveal: 'Mọi vụ mất tích đều xảy ra đúng Giờ Tý. Lúc âm khí thịnh nhất, cánh cửa giữa hai cõi mở ra.',
  },
  {
    title: 'Bài thơ trên bàn thờ',
    story: 'Kẹp dưới bát hương là một bài thơ bảy câu. Người viết như muốn giấu điều gì đó ngay trước mắt.',
    style: 'poem',
    lines: [
      'Tối nay gió rít qua song cửa,',
      'Ai đó cười khẽ ở cuối hiên,',
      'Nến tắt dần trên bàn thờ cũ,',
      'Gương vỡ soi bóng kẻ không tên.',
      'Hồn ai lạc lối chưa siêu thoát,',
      'Âm khí lạnh ngắt dưới chân thềm,',
      'Mau tìm nơi tối nhất trong nhà.',
    ],
    question: 'Nơi tối nhất trong nhà là đâu?',
    hints: ['Đừng đọc nội dung, hãy nhìn vào chữ cái đầu tiên của mỗi câu.', 'Ghép 7 chữ cái đầu: T, A, N, G… Đáp án là một tầng của ngôi nhà.'],
    answers: ['TANGHAM', 'HAM'],
    display: 'Tầng hầm',
    twist: 'dark',
    reveal: 'Dưới tầng hầm có bảy chiếc ghế xếp vòng tròn. Sáu chiếc đã có người ngồi.',
  },
  {
    title: 'La bàn bát quái',
    story: 'Trên nắp hòm gỗ khắc tám quẻ và hướng của chúng. Một quẻ đã bị cào mất hướng. Dòng chữ nhỏ ghi: "Bùa trấn trạch giấu ở hướng quẻ Càn, đối diện quẻ Tốn."',
    style: 'han',
    lines: [
      '☲ Ly · Nam        ☵ Khảm · Bắc',
      '☳ Chấn · Đông     ☱ Đoài · Tây',
      '☴ Tốn · Đông Nam  ☷ Khôn · Tây Nam',
      '☶ Cấn · Đông Bắc  ☰ Càn · ???',
    ],
    question: 'Bùa trấn trạch được giấu ở hướng nào?',
    hints: ['Các quẻ đứng thành từng cặp đối diện: Ly đối Khảm (Nam đối Bắc), Chấn đối Đoài (Đông đối Tây).', 'Tốn ở Đông Nam, vậy quẻ đối diện nằm ở hướng ngược lại hoàn toàn.'],
    answers: ['TAYBAC', 'HUONGTAYBAC'],
    display: 'Tây Bắc',
    twist: 'sector',
    reveal: 'Lá bùa ở góc Tây Bắc đã bị xé đôi. Ai đó đã cố ý phá trận pháp bảo vệ ngôi nhà.',
  },
  {
    title: 'Mảnh giấy bị vò',
    story: 'Trong túi áo cưới đỏ có một mảnh giấy bị vò nát. Các chữ cái bị xáo trộn, kèm dòng chú thích: "Người đứng trước gương, mặc áo đỏ."',
    style: 'big',
    lines: ['U · D · A · O · C'],
    question: 'Người đứng trước gương là ai?',
    hints: ['Sắp xếp lại 5 chữ cái thành 2 từ có nghĩa.', 'Người này mặc hỷ phục đỏ trong ngày trọng đại nhất đời.'],
    answers: ['CODAU'],
    display: 'Cô dâu',
    twist: 'mirror',
    reveal: 'Cô dâu chết ngay trong đêm tân hôn. Từ đó, gương trong nhà luôn phản chiếu một bóng áo đỏ.',
  },
  {
    title: 'Cuộc gọi cuối cùng',
    story: 'Chiếc điện thoại bàn cũ vẫn còn lưu số cuối cùng được bấm. Dán trên máy là ghi chú: "Nơi thắp nhang mỗi tối, 2 từ."',
    style: 'grid',
    lines: [
      '1      2 ABC   3 DEF',
      '4 GHI  5 JKL   6 MNO',
      '7 PQRS 8 TUV   9 WXYZ',
      '',
      'Số đã bấm:  2 2 6 · 8 4 6',
    ],
    question: 'Nạn nhân muốn nhắn mọi người đến đâu?',
    hints: ['Mỗi phím ứng với 3–4 chữ cái. 226 là từ thứ nhất, 846 là từ thứ hai.', 'Từ thứ nhất: B-A-N. Nơi này có bát hương và ảnh người đã khuất.'],
    answers: ['BANTHO'],
    display: 'Bàn thờ',
    twist: 'incense',
    reveal: 'Sau bàn thờ là một hốc tường bí mật, bên trong có cuốn gia phả bị gạch tên bảy người.',
  },
  {
    title: 'Bia đá trước cổng',
    story: 'Bia đá trước cổng có hai chữ Hán đã mờ. Trong cuốn từ điển cũ để trong nhà, ai đó đã khoanh sẵn vài chữ.',
    style: 'han',
    lines: [
      'Trên bia:   鬼   門',
      '',
      '封 = phong   北 = bắc   門 = môn (cửa)',
      '鬼 = quỷ     火 = hỏa   水 = thủy',
    ],
    question: 'Hai chữ trên bia đọc là gì?',
    hints: ['Tra từng chữ trên bia trong danh sách bên dưới.', 'Đọc theo âm Hán Việt, nghĩa là "cửa của ma quỷ".'],
    answers: ['QUYMON', 'CUAQUY'],
    display: 'Quỷ Môn (Cửa Quỷ)',
    twist: 'gate',
    reveal: 'Ngôi nhà được xây đúng trên Quỷ Môn. Người xây biết điều đó, và vẫn cố tình xây.',
  },
  {
    title: 'Lũ ma sinh sôi',
    story: 'Trang cuối nhật ký của người chủ nhà viết: "Mỗi đêm số oan hồn trong nhà tăng gấp đôi. Đến đêm thứ bảy, nhà đầy ma."',
    style: 'big',
    lines: ['1 → 2 → 4 → … → ĐẦY'],
    question: 'Đêm thứ mấy ngôi nhà mới đầy một nửa?',
    hints: ['Nếu đêm sau gấp đôi đêm trước, thì đêm trước bằng một nửa đêm sau.', 'Đêm thứ bảy đầy, vậy một nửa là đêm liền trước đó.'],
    answers: ['6', 'SAU', 'DEM6', 'DEMTHU6', 'DEMTHUSAU', 'DEMSAU', 'THU6', 'THUSAU'],
    display: 'Đêm thứ 6',
    twist: 'pairs',
    reveal: 'Đêm thứ sáu là đêm người chủ nhà bỏ trốn. Ông ta để lại cả gia đình cho lũ oan hồn.',
  },
  {
    title: 'Cầu thang mười lăm bậc',
    story: 'Cầu thang lên gác có 15 bậc. Hồn ma trên chiếu nghỉ mỗi lần bước lên 4 bậc thì lại trượt xuống 1 bậc.',
    style: 'big',
    lines: ['▲ 4   ▼ 1', 'Đích: bậc 15'],
    question: 'Sau bao nhiêu lần bước lên, hồn ma chạm tới bậc 15?',
    hints: ['Mỗi lượt đầy đủ (lên 4, xuống 1) chỉ tiến được 3 bậc. Nhưng lần cuối chạm đích rồi thì không trượt nữa.', 'Sau 4 lượt đứng ở bậc 12. Lần bước tiếp theo lên 4 bậc là chạm đích.'],
    answers: ['5', 'NAM', '5LAN', 'NAMLAN'],
    display: '5 lần',
    twist: 'steps',
    reveal: 'Mỗi đêm hồn ma tiến thêm vài bậc. Khi nó lên tới phòng ngủ, sẽ không còn ai kịp chạy.',
  },
];

export function normAnswer(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function checkAnswer(pz, input) {
  const n = normAnswer(input);
  return n.length > 0 && pz.answers.map(normAnswer).includes(n);
}
