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

| Thao tác | Kết quả |
|---|---|
| Ghi danh bằng tên | Tên là duy nhất, hiện trên bảng xếp hạng |
| Xoay điện thoại / kéo chuột | Nhìn quanh, theo mũi tên đỏ và máy đo EMF |
| Vuốt bùa lên phía ma | Ném bùa, ném lúc vòng tròn **xanh lá** để tỷ lệ ×1.6 |
| Phong ấn thành công | Tiếng chiêng, vòng ấn chú, dấu triện 封印, +XP, hồi 1 Dương khí |
| **Bắt hụt** | Bùa cháy rụi, ma **nổi điên**: nhạc dồn dập, còn tối đa **5 giây** |
| Hết giờ | Ma lao thẳng vào mặt kèm **tiếng hét kinh dị**, mất 1 Dương khí |
| Cạn 3 Dương khí | Bị trừ 100 XP, thắp nhang để hồi dương |

Nhạc nền tự đổi theo tình huống: **yên ắng** (dò ma) → **tim đập** (gặp ma) → **trống dồn dập + tiếng rít tăng dần** (5 giây cuối).
Thỉnh thoảng có tiếng thì thầm, tiếng gõ cửa, hộp nhạc lạc tông, bóng ma loé lên ở mép màn hình. Nút 🔊 để tắt tiếng.

## 4. Danh sách ma

Trong game **không hiện tên**, người chơi chỉ thấy hình. Tên dưới đây để bạn quản lý trong `src/ghosts.js`.

| Ma | Độ hiếm | Tỷ lệ bắt gốc |
|---|---|---|
| Bóng Trắng Cuối Hành Lang | Oán linh | 38% |
| Oan Hồn Tóc Rũ | Oán linh | 34% |
| Nữ Quỷ Gầm Tủ | Lệ quỷ | 22% |
| Ma Nữ Cầu Thang | Đại hung | 10% |

Mọi con ma: xuất hiện sau ~3 giây, **10 giây** để bắt, 5 giây cuối nổi điên, hết giờ bị tấn công ngay.

## 5. Tuỳ chỉnh nhanh

| Muốn sửa | File |
|---|---|
| Tên, mô tả, tỷ lệ bắt, thời gian tấn công của ma | `src/ghosts.js` |
| Thêm ma mới | Ảnh PNG/WebP nền trong suốt vào `public/ghosts/`, khai báo trong `src/ghosts.js` |
| Thời gian bắt, thời gian ma xuất hiện, vùng trúng, XP bị trừ | Đầu file `src/App.jsx` |
| Nhạc nền, âm thanh | `src/lib/music.js`, `src/lib/sound.js` |
| Tiếng hét khi bị tấn công | Thay file `public/sfx/scream.mp3` (giữ nguyên tên) |
| Số bùa, số Dương khí | `src/lib/storage.js` |
| Luật chống hack điểm | `api/score.js` |

## 6. Lưu ý

- Mở bằng **Safari / Chrome**, không mở trong Zalo, Facebook (thường chặn camera).
- Tên gắn với trình duyệt đã ghi danh. Đổi máy hoặc xoá dữ liệu trình duyệt sẽ không lấy lại được tên cũ.
- Chạy thử trên máy: `npm install` rồi `npm run dev` (bảng xếp hạng chỉ chạy trên Vercel, local sẽ là ngoại tuyến).

## Cấu trúc

```
san-ma/
├── api/                   # Vercel Functions: ghi danh, gửi điểm, bảng xếp hạng
├── public/ghosts/         # Ảnh ma (nền trong suốt)
└── src/
    ├── App.jsx            # Lõi game: camera, cảm biến, ném bùa, ma tấn công
    ├── ghosts.js          # Danh sách ma
    ├── components/        # Ghi danh, Sổ Ma, Bảng xếp hạng, thẻ phong ấn, cạn dương khí
    └── lib/               # Cảm biến, âm thanh, lưu trữ, gọi API
```
