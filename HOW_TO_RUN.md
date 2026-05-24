# 🚀 Hướng dẫn chạy dự án CoreHRM

## Yêu cầu
- Node.js v20+
- Docker Desktop

---

## Lần đầu chạy

**Bước 1 — Cài thư viện**
```bash
npm install
```

**Bước 2 — Khởi động Database (PostgreSQL)**
```bash
docker compose up -d
```

**Bước 3 — Khởi tạo Database** *(chỉ cần làm 1 lần)*
```bash
cd apps/api
npx prisma generate
npx prisma db push
npx prisma db seed
cd ../..
```

**Bước 4 — Chạy Backend, Web và Mobile** *(mở 3 terminal)*
```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web

# Terminal 3
npm run dev:mobile
```

---

## Từ lần sau trở đi

**Bước 1: Bật Docker Desktop**
- Bắt buộc phải mở phần mềm Docker Desktop trên máy tính và đợi nó báo "Running" (màu xanh). Database sẽ tự chạy ngầm.

**Bước 2: Chạy các ứng dụng**
Mở 3 tab Terminal (đảm bảo đang ở **thư mục gốc** `CoreHRM-main`) và chạy 3 lệnh sau:
```bash
npm run dev:api      # Terminal 1: Chạy Backend
npm run dev:web      # Terminal 2: Chạy Web Admin
npm run dev:mobile   # Terminal 3: Chạy Mobile App
```

---

## Địa chỉ truy cập

| | |
|---|---|
| 🌐 Web Admin | http://localhost:3000 |
| ⚙️ API | http://localhost:4000 |
| 📱 Mobile App | Expo Go (Quét mã QR trên terminal) |

**Tài khoản mặc định:** `admin@example.com` / `123456`

---

## Xem dữ liệu DB trực quan *(tuỳ chọn)*
```bash
cd apps/api
npx prisma studio   # Truy cập http://localhost:5555
```
