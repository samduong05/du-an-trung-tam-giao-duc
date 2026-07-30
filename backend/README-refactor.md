# Refactored server

Bản này tách từ server.js gộp sang cấu trúc nhiều file.

## Cách dùng

1. Copy các thư mục/file này vào thư mục server hiện tại.
2. Giữ nguyên thư mục `models/` cũ.
3. Giữ nguyên file `.env` cũ.
4. Chạy:

```bash
node server.js
```

hoặc nếu dùng nodemon:

```bash
npm run dev
```

## Lưu ý

- Bản này cố tình giữ nguyên endpoint cũ: `/login`, `/register`, `/classes`, ...
- Chưa thêm JWT/cookie.
- Chưa đổi sang 3 model Admin/Teacher/Student.
- Mục tiêu bước này là tách cấu trúc trước, chạy được trước.
