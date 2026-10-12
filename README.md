# 👻 Săn Ma AR

Game săn ma thực tế ảo trên trình duyệt: mở camera, xoay điện thoại tìm ma, vuốt bùa để phong ấn vào **Sổ Ma**.
React + Vite, không cần backend, tiến độ lưu trong trình duyệt.

---

## 1. Đưa lên GitHub (Windows, không cần cài gì)

1. Giải nén file zip → được thư mục `san-ma`.
2. Vào https://github.com/new → đặt tên repo `san-ma` → **Create repository**.
3. Bấm link **uploading an existing file**.
4. Mở thư mục `san-ma`, chọn **tất cả file và thư mục bên trong** (Ctrl + A), kéo thả vào trang GitHub.
   - Kéo nội dung bên trong, **không** kéo cả thư mục `san-ma`.
   - Không upload thư mục `node_modules` nếu bạn đã chạy thử trên máy.
5. Bấm **Commit changes**.

> Kiểm tra: trang repo phải thấy ngay `package.json`, `index.html`, `src/` ở cấp ngoài cùng.

## 2. Deploy lên Vercel

1. Vào https://vercel.com → đăng nhập bằng GitHub.
2. **Add New → Project** → chọn repo `san-ma` → **Import**.
3. Vercel tự nhận **Vite**, giữ nguyên cài đặt → **Deploy**.
4. Khoảng 1 phút sau có link dạng `https://san-ma-xxx.vercel.app`.

Từ đó, mỗi lần sửa file trên GitHub là Vercel tự deploy lại.

## 3. Chơi trên điện thoại

- Mở link bằng **Safari (iPhone)** hoặc **Chrome (Android)**.
- **Không mở trong Zalo / Facebook / Messenger** (trình duyệt trong app thường chặn camera) → chọn "Mở bằng trình duyệt".
- Bấm **Cho phép** khi được hỏi Camera và Chuyển động.
- Cầm máy dọc, xoay người theo mũi tên và máy đo EMF bên phải.

## 4. Cách chơi

| Thao tác | Kết quả |
|---|---|
| Xoay điện thoại (hoặc kéo chuột trên máy tính) | Nhìn quanh, tìm ma |
| Vuốt lá bùa lên phía ma | Ném bùa |
| Ném khi vòng tròn **xanh lá** (nhỏ nhất) | Tỷ lệ bắt ×1.8 |
| Dùng Bùa Vàng | Tỷ lệ bắt ×1.8 |
| Hết bùa | Bấm **Thắp nhang** nhận 10 bùa |

Ma có 3 độ hiếm: Thường, Hiếm, Huyền thoại. Lên cấp càng cao, ma hiếm càng dễ gặp.

## 5. Tuỳ chỉnh nhanh

| Muốn sửa | File |
|---|---|
| Thêm / đổi tên ma, màu, mô tả, tỷ lệ bắt | `src/ghosts.js` |
| Tốc độ vòng tròn, góc nhìn, kích thước ma | Đầu file `src/App.jsx` |
| Số bùa ban đầu | `src/lib/storage.js` |
| Màu sắc, giao diện | `src/styles.css` |

## 6. (Tuỳ chọn) Chạy thử trên máy Windows

Cài Node.js LTS tại https://nodejs.org, mở thư mục bằng VS Code, mở Terminal (Ctrl + `):

```bash
npm install
npm run dev
```

Mở http://localhost:5173 → kéo chuột hoặc phím mũi tên để nhìn quanh.
Camera điện thoại chỉ chạy qua HTTPS, nên test trên điện thoại hãy dùng link Vercel.

## Cấu trúc

```
san-ma/
├── index.html
├── package.json
├── vite.config.js
├── public/favicon.svg
└── src/
    ├── App.jsx            # Lõi game: camera, cảm biến, ném bùa, bắt ma
    ├── ghosts.js          # Danh sách ma
    ├── styles.css
    ├── components/        # Ghost, Talisman, Sổ Ma, thẻ bắt được, màn hình đầu
    └── lib/               # Cảm biến xoay, âm thanh, lưu tiến độ
```
