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
| Vuốt bùa lên phía ma | Ném bùa, ném lúc vòng tròn **xanh lá** để tỷ lệ ×1.8 |
| Hết thời gian **Tấn công sau** | Ma lao tới hù, mất 1 Dương khí |
| Bắt hụt, ma phá bùa | Ma nổi giận, thời gian bị rút 4 giây |
| Phong ấn thành công | +XP, +bùa, hồi 1 Dương khí |
| Cạn 3 Dương khí | Bị trừ 100 XP, thắp nhang để hồi dương |

## 4. Danh sách ma

| Ma | Độ hiếm | Thời gian trước khi tấn công |
|---|---|---|
| Quỷ Khâu Mắt | Oán linh | 20s |
| Oán Nhi Tầm Mẫu | Oán linh | 18s |
| Xà Diện Huyết Nữ | Lệ quỷ | 15s |
| Thi Cốt Mộc Nhân | Lệ quỷ | 16s |
| Dạ Xoa Nghìn Mặt | Đại hung | 12s |

## 5. Tuỳ chỉnh nhanh

| Muốn sửa | File |
|---|---|
| Tên, mô tả, tỷ lệ bắt, thời gian tấn công của ma | `src/ghosts.js` |
| Thêm ma mới | Ảnh PNG/WebP nền trong suốt vào `public/ghosts/`, khai báo trong `src/ghosts.js` |
| XP bị trừ khi chết, thời gian lao tới, độ nổi giận | Đầu file `src/App.jsx` |
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
├── public/ghosts/         # Ảnh 5 con ma (nền trong suốt)
└── src/
    ├── App.jsx            # Lõi game: camera, cảm biến, ném bùa, ma tấn công
    ├── ghosts.js          # Danh sách ma
    ├── components/        # Ghi danh, Sổ Ma, Bảng xếp hạng, thẻ phong ấn, cạn dương khí
    └── lib/               # Cảm biến, âm thanh, lưu trữ, gọi API
```
