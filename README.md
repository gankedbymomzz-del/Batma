# 👻 Săn Ma AR

Game săn ma thực tế ảo trên trình duyệt: mở camera, xoay điện thoại tìm ma, vuốt bùa phong ấn.
Ma đứng lâu không bị bắt sẽ **lao tới tấn công**. Ghi danh bằng tên để **thi đua trên bảng xếp hạng**.

React + Vite + Vercel Functions + Upstash Redis (miễn phí).

---

## 1. Cập nhật lên GitHub (repo `san-ma` đã có)

1. Giải nén zip → thư mục `san-ma`.
2. Vào repo trên GitHub → **Add file → Upload files**.
3. Mở thư mục `san-ma`, **Ctrl + A** chọn tất cả bên trong, kéo thả vào trang → **Commit changes**.
   File trùng tên sẽ được ghi đè. Thư mục mới `api/` và `public/ghosts/` tự được thêm.

> Kiểm tra: repo phải có thư mục `api/` ngang hàng với `src/`.

## 2. Bật bảng xếp hạng (làm 1 lần, ~2 phút)

1. Vào Vercel → mở project `san-ma` → tab **Storage**.
2. **Create Database** → chọn **Upstash** → **Upstash for Redis** → gói **Free** → Create.
3. Chọn **Connect** vào project `san-ma` (giữ tick Production + Preview).
4. Tab **Deployments** → bấm `⋯` ở bản mới nhất → **Redeploy**.

Vercel tự gắn biến môi trường (`KV_REST_API_URL`, `KV_REST_API_TOKEN` hoặc `UPSTASH_REDIS_REST_*`), không cần chép tay.

Chưa bật bước này game vẫn chơi được, người chơi ở chế độ **ngoại tuyến** (điểm lưu trên máy).

## 3. Cách chơi

Chơi theo **từng đêm**. Phong ấn đủ số oan hồn để thấy trời sáng. Cạn 3 Dương khí là chơi lại đêm đó.

| Đêm | Số ma | Giây mỗi lần | Điểm mới |
|---|---|---|---|
| 1 | 3 | 10 | Chỉ ma Oán linh |
| 2 | 4 | 9 | Lệ quỷ xuất hiện |
| 3 | 5 | 8 | Ma có **chiêu riêng** |
| 4 | 5 | 8 | **2 con cùng lúc** |
| 5 | 6 | 7 | Có **bản giả** |
| 6 | 6 | 6 | Đại hung thức giấc |
| **7** | **Trùm** | 15 / 13 / 11 | Phong ấn 3 lần, mỗi lần đổi chiêu |
| 8+ | 7–12 | 6 → 4,5 | **Đêm vô tận**, mỗi đêm khó hơn |

| Thao tác | Kết quả |
|---|---|
| Vuốt bùa lên phía ma | Ném bùa, ném lúc vòng tròn **xanh lá** để tỷ lệ ×1.6 |
| Phong ấn thành công | Tiếng chiêng, vòng ấn chú, dấu triện 封印, hồi 1 Dương khí |
| Bắt hụt | Bùa cháy rụi, ma nổi điên, còn tối đa 5 giây |
| Ném trúng bản giả | Bản giả tan biến, mất bùa và 1 giây |
| Hết giờ | Ma lao tới kèm tiếng hét, mất 1 Dương khí |

Bảng xếp hạng: **số đêm đã qua** trước, rồi mới tới XP.

## 4. Chiêu riêng của từng con ma (từ Đêm 3)

Trong game không hiện tên. Chiêu được ghi vào Sổ Ma sau lần bắt đầu tiên.

| Ma | Độ hiếm | Chiêu | Cách khắc chế |
|---|---|---|---|
| Bóng Trắng Cuối Hành Lang | Oán linh | Chỉ tiến lại gần khi bạn không nhìn, thời gian trôi gấp đôi | Tìm nhanh, giữ nó trong khung hình |
| Oan Hồn Tóc Rũ | Oán linh | Tàng hình khi bạn xoay máy | Giữ máy thật yên |
| Nữ Quỷ Gầm Tủ | Lệ quỷ | Bò sát sàn nhà | Hạ máy xuống |
| Ma Nữ Cầu Thang | Đại hung | Phân thân 3, đổi chỗ liên tục | Con thật có mắt sáng rực, bản giả mờ hơn |

## 4b. Vàng mã & pháp khí

Phong ấn ma và sống sót qua đêm để kiếm **vàng mã**. Trước mỗi đêm, vào **Tiệm vàng mã** để chuẩn bị.

| Pháp khí | Giá | Tác dụng | Khắc chế |
|---|---|---|---|
| 🔔 Chuông trấn hồn | 40 | Mọi con ma và đồng hồ dừng 2,5 giây | Ma chạy nhanh, sắp hết giờ |
| 🪞 Gương bát quái | 50 | 5 giây: bản giả bị gạch ✕, con thật sáng vàng | Ma Nữ Cầu Thang, bản giả |
| 🪔 Đèn dầu | 35 | 4 giây: ma không thể tàng hình | Oan Hồn Tóc Rũ |
| 🕯️ Nén nhang | 45 | Hồi 1 dương khí ngay giữa đêm | Cứu nguy |

Mỗi món mang tối đa 3. Tiệm cũng bán 5 Bùa Giấy (20) và 1 Bùa Vàng (30).
Thanh pháp khí nằm bên trái màn hình, chạm để dùng.

| Nguồn vàng mã | Số lượng |
|---|---|
| Oán linh / Lệ quỷ / Đại hung | 10 / 25 / 60, tăng 10% mỗi đêm |
| Qua đêm N | 30 × N |

## 4c. Trùm, chuỗi, giờ thật, danh hiệu

**Trùm đêm 7:** 3 giai đoạn. Phong ấn xong một lần, trùm lột xác và đổi chiêu: bản giả → tàng hình → bò sát sàn. Bị tấn công thì trùm quay lại nhưng **giữ nguyên tiến độ**. Hạ trùm: +500 XP, +200 vàng mã.

**Chuỗi phong ấn:** bắt liên tiếp không hụt, XP và vàng mã nhân dần (tối đa ×2), nhưng ma cũng nhanh dần. Trượt, ném trúng bản giả, ma phá bùa hoặc bị tấn công đều mất chuỗi.

**Giờ thật** (theo đồng hồ điện thoại, xét lúc bắt đầu mỗi đêm):

| Sự kiện | Khi nào | Hiệu ứng |
|---|---|---|
| Giờ Tý | 23h – 3h sáng | Đại hung gấp đôi, XP ×1,25, camera tối lạnh |
| Đêm trăng máu | Thứ bảy 18h – Chủ nhật 4h | XP và vàng mã ×1,5, ma hung hơn, nhuốm đỏ |

Hai sự kiện cộng dồn được.

**Danh hiệu thầy pháp** (hiện trên bảng xếp hạng và màn hình đầu):

| Số đêm đã qua | 0 | 2 | 4 | 7 (hạ trùm) | 10 | 15 |
|---|---|---|---|---|---|---|
| Danh hiệu | Tập sự | Đạo sĩ | Pháp sư | Thiên sư | Chưởng môn | Tổ sư |

## 4d. Phòng chơi chung

Màn hình đầu → **Chơi cùng phòng** (cần ghi danh online).

```
Tạo phòng → mã 4 số → mọi người nhập mã → phòng chờ → chủ phòng bấm Bắt đầu
   → CẢ PHÒNG CÙNG GIẢI 1 MẬT THƯ (ai đoán đúng trước, cả phòng qua màn)
   → đếm ngược 6 giây → ĐUA PHONG ẤN 5 OAN HỒN → ai xong trước THẮNG
   → chủ phòng mở ván mới (mật thư khác)
```

| Luật | Chi tiết |
|---|---|
| Số người | Tối đa 12 |
| Mật thư | 4 phút, gợi ý 1 sau 1 phút, gợi ý 2 sau 2 phút, quá giờ tự qua màn |
| Màn đua | Mọi người gặp **cùng một chuỗi ma**. 9 giây mỗi con, có chiêu riêng |
| Cạn dương khí | Bất tỉnh 5 giây rồi săn tiếp, không bị loại |
| Hết 6 phút | Ai phong ấn nhiều nhất thắng |
| Chống gian lận | Máy chủ kiểm đáp án và quyết định người thắng |

**12 mật thư** theo cốt truyện "Hồ sơ nhà số 7": chữ soi gương, dịch chữ, Morse, số thành chữ, đồng hồ, thơ giấu chữ đầu dòng, bát quái, đảo chữ, bàn phím điện thoại, chữ Hán Việt, câu đố logic. Mỗi ván rút một mật thư chưa chơi trong phòng đó.

**Chi phí Upstash miễn phí** (500.000 lệnh/tháng): một trận 10 người khoảng 10–15 nghìn lệnh, đủ cho khoảng 30–40 trận/tháng.

## 4e. Manh mối màn đua (phòng chơi)

Đáp án mật thư là **manh mối** thay đổi luật màn đua. Người giải được thưởng +1 Chuông trấn hồn.

| Mật thư → đáp án | Manh mối | Màn đua thay đổi |
|---|---|---|
| Soi gương → Đáy giếng | Từ đáy giếng | Ma trồi lên từ dưới thấp |
| Dịch chữ → Cửa sau | Cửa sau | Ma xuất hiện sau lưng |
| Morse → Cứu | Trong tủ áo | Phần lớn là ma bò sát sàn |
| Dãy số → Tìm mẹ | Trốn tìm | Ma chỉ tiến lại khi bạn quay đi |
| Đồng hồ → 12 giờ | Giờ Tý | Đại hung xuất hiện, XP ×1,25 |
| Thơ → Tầng hầm | Tầng hầm | Tối om, phần lớn ma tàng hình |
| Bát quái → Tây Bắc | Hướng Tây Bắc | Mọi con ma đến từ cùng một hướng |
| Đảo chữ → Cô dâu | Gương tân hôn | Con nào cũng có bản giả |
| Bàn phím → Bàn thờ | Bàn thờ | Tặng 1 nén nhang, dễ bắt hơn 10% |
| Chữ Hán → Quỷ Môn | Quỷ Môn mở | Ma nhanh hơn, chỉ 7 giây mỗi con |
| Logic → Đêm 6 | Sinh sôi | Có lúc 2 con cùng lúc |
| Cầu thang → 5 | Mười lăm bậc | Bắt càng nhiều, ma càng nhanh |

## 4f. Cốt truyện "Hồ sơ nhà số 7" (chơi đơn)

- **Lời mở đầu:** lá thư mời không tên, hiện một lần trước đêm 1.
- **Lời dẫn mỗi đêm** trên màn mở đầu đêm.
- **7 trang nhật ký:** qua mỗi đêm nhặt một trang (cô hầu gái, cậu út, bà chủ, cô dâu, thầy địa lý, ông chủ nhà, trang cuối). Đọc lại trong Sổ Ma → tab Nhật ký.
- **Lai lịch ma:** phong ấn một loại ma đủ 3 lần sẽ biết nó là ai lúc còn sống.
- **Cái kết** mở ra khi hạ trùm đêm 7, và một chi tiết để ngỏ cho Đêm vô tận.

Nội dung truyện khớp với 12 mật thư của chế độ phòng: hai chế độ cùng kể một câu chuyện.

## 5. Tuỳ chỉnh nhanh

| Muốn sửa | File |
|---|---|
| Tên, mô tả, tỷ lệ bắt, chiêu riêng của ma | `src/ghosts.js` |
| Thêm ma mới | Ảnh PNG/WebP nền trong suốt vào `public/ghosts/`, khai báo trong `src/ghosts.js` |
| Số ma, thời gian bắt, tốc độ… của từng đêm | `src/nights.js` |
| Giá, tác dụng pháp khí, vàng mã nhận được | `src/items.js` |
| Trùm (chiêu, thời gian từng giai đoạn) | `BOSS` trong `src/ghosts.js` |
| Danh hiệu / Giờ Tý, trăng máu | `src/titles.js` / `src/omen.js` |
| Mật thư (thêm, sửa, đáp án) | `api/_lib/puzzles.js` |
| Manh mối màn đua | `src/twists.js` |
| Cốt truyện, nhật ký, lai lịch ma | `src/story.js` |
| Luật phòng (số người, thời gian, số ma) | Đầu file `api/room.js` |
| Thời gian ma xuất hiện, vùng trúng, vòng tròn | Đầu file `src/App.jsx` |
| Nhạc nền, âm thanh | `src/lib/music.js`, `src/lib/sound.js` |
| Tiếng hét khi bị tấn công | Thay file `public/sfx/scream.mp3` (giữ nguyên tên) |
| Số bùa, số Dương khí | `src/lib/storage.js` |
| Luật chống hack điểm | `api/score.js` |

## 5b. Hiệu năng & máy yếu

- Camera chạy 720p/30 khung hình, đủ đẹp mà nhẹ hơn nhiều.
- Ẩn app (về màn hình chính, chuyển app) → camera và âm thanh **tự tắt**, quay lại tự bật. Thoát hẳn trang → giải phóng toàn bộ.
- **Chế độ nhẹ** tự bật khi máy chạy dưới 40 khung hình/giây: tắt nhiễu hạt, sương mù, bóng đổ của ma và vài hiệu ứng rung. Có thể bật/tắt tay ở màn hình đầu.

## 6. Lưu ý

- Mở bằng **Safari / Chrome**, không mở trong Zalo, Facebook (thường chặn camera).
- Tên gắn với trình duyệt đã ghi danh. Đổi máy hoặc xoá dữ liệu trình duyệt sẽ không lấy lại được tên cũ.
- Chạy thử trên máy: `npm install` rồi `npm run dev` (bảng xếp hạng chỉ chạy trên Vercel, local sẽ là ngoại tuyến).

## Cấu trúc

```
san-ma/
├── api/                   # Vercel Functions: ghi danh, điểm, xếp hạng, phòng chơi
│   └── _lib/puzzles.js    # Bộ mật thư (để ở máy chủ, người chơi không xem được đáp án)
├── public/ghosts/         # Ảnh ma (nền trong suốt)
└── src/
    ├── App.jsx            # Lõi game: camera, cảm biến, ném bùa, ma tấn công
    ├── ghosts.js          # Danh sách ma + chiêu riêng
    ├── nights.js          # Cấu hình độ khó từng đêm
    ├── items.js           # Pháp khí, tiệm vàng mã
    ├── titles.js          # Danh hiệu thầy pháp
    ├── omen.js            # Giờ Tý, Đêm trăng máu
    ├── twists.js          # Manh mối màn đua
    ├── story.js           # Cốt truyện, nhật ký, lai lịch ma
    ├── components/        # Ghi danh, Sổ Ma, Bảng xếp hạng, thẻ phong ấn, màn đêm, hiệu ứng
    └── lib/               # Cảm biến, âm thanh, lưu trữ, gọi API
```
