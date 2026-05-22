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

**Bước 4 — Chạy Backend + Web** *(mở 2 terminal)*
```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web
```

---

## Từ lần sau trở đi

Chỉ cần mở Docker Desktop rồi chạy 2 lệnh:
```bash
npm run dev:api   # Terminal 1
npm run dev:web   # Terminal 2
```

---

## Địa chỉ truy cập

| | |
|---|---|
| 🌐 Web Admin | http://localhost:3000 |
| ⚙️ API | http://localhost:4000 |

**Tài khoản mặc định:** `admin@example.com` / `123456`

---

## Xem dữ liệu DB trực quan *(tuỳ chọn)*
```bash
cd apps/api
npx prisma studio   # Truy cập http://localhost:5555
```
