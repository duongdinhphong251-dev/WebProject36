#Nhom36 
## Yêu cầu cài đặt

- **Node.js** >= 20: https://nodejs.org
- **PostgreSQL** >= 15 (chọn 1 trong 2 cách):
  - **Cách A** — Docker Desktop: https://www.docker.com/products/docker-desktop
  - **Cách B** — Cài trực tiếp: https://www.postgresql.org/download/

Kiểm tra đã cài:
```powershell
node --version    # >= 20
npm --version
docker --version  # nếu dùng Docker
```

---

## Bước 1 — Clone repo

```powershell
git clone <URL-repo-của-nhóm>
cd Project
```

---

## Bước 2 — Chạy PostgreSQL

### Cách A — Dùng Docker (khuyến nghị)

```powershell
docker run --name pj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=tuoi_db `
  -p 5433:5432 `
  -d postgres:16
```

> Lần đầu tải image ~150MB. Đợi 30 giây.

**Lưu ý:** dùng port **5433** (không phải 5432) để tránh conflict nếu máy có Postgres native.

### Cách B — PostgreSQL native

1. Cài PostgreSQL → nhớ password user `postgres`
2. Mở pgAdmin hoặc SQL Shell → tạo DB:
   ```sql
   CREATE DATABASE tuoi_db;
   ```
3. Port dùng **5432**

---

## Bước 3 — Cấu hình BE

```powershell
cd pj-be
notepad .env
```

Dán nội dung (sửa `DB_PORT` theo cách đã chọn):

```env
PORT=8081
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5433
DB_NAME=tuoi_db
DB_USER=postgres
DB_PASSWORD=postgres

DB_BOOTSTRAP_SCHEMA=true
FAKE_ENGAGEMENT_ENABLED=false
```

- Nếu dùng **Docker** → `DB_PORT=5433`
- Nếu dùng **Postgres native** → `DB_PORT=5432`

**Ctrl + S**, đóng Notepad.

---

## Bước 4 — Cấu hình FE

```powershell
cd ..\pj-fe
copy .env.exemple .env.local
notepad .env.local
```

Đảm bảo có:
```env
NEXT_PUBLIC_APP_NAME="Nhom36"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API="http://localhost:8081"
NODE_ENV="development"
```

**Ctrl + S**, đóng Notepad.

---

## Bước 5 — Cài dependencies

```powershell
# Trong pj-be
cd ..\pj-be
npm install

# Trong pj-fe
cd ..\pj-fe
npm install
```

Mỗi bên mất 1-2 phút.

---

## Bước 6 — Tạo schema DB

```powershell
cd ..\pj-be
npx drizzle-kit push --config=drizzle.config.ts
```

Khi được hỏi confirm → gõ `y` → Enter.

Mong đợi: `[✓] Changes applied`

---

## Bước 7 — Seed data mẫu

```powershell
# Vẫn trong pj-be
Get-Content seed-demo.sql | docker exec -i pj-postgres psql -U postgres -d tuoi_db
Get-Content seed-locations.sql | docker exec -i pj-postgres psql -U postgres -d tuoi_db
```

> Nếu dùng Postgres native (không Docker), thay `docker exec -i pj-postgres psql ...` bằng `psql -U postgres -d tuoi_db`.

Verify:
```powershell
docker exec pj-postgres psql -U postgres -d tuoi_db -c "SELECT COUNT(*) FROM spas;"
```
Mong đợi: `3`

---

## Bước 8 — Chạy dự án

### Terminal 1 — BE

```powershell
cd pj-be
npm run start:dev
```

Đợi tới khi thấy:
```
Application is running on: http://localhost:8081
```

**Giữ terminal này mở.**

### Terminal 2 — FE

Mở terminal mới (trong VS Code: `Ctrl + Shift + \``):

```powershell
cd pj-fe
npm run dev
```

Đợi tới khi thấy:
```
✓ Ready in Xs
```

---

## Bước 9 — Mở web

Browser → `http://localhost:3000`

---

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `password authentication failed` | Sai password DB | Kiểm tra `DB_PASSWORD` trong `.env` = password container/native |
| `ECONNREFUSED 127.0.0.1:5433` | Postgres chưa chạy | `docker ps` kiểm tra, chạy lại Bước 2 |
| `port is already allocated` | Port 5433 bị chiếm | Đổi port khác: `-p 5434:5432`, sửa `.env` |
| `ENOENT package.json` | Sai folder | `cd` vào đúng `pj-be` hoặc `pj-fe` |
| Web hiện nhưng không có data | Chưa seed | Chạy lại Bước 7 |
| Trang trắng ở `/massage-spa/ha-noi` | Thiếu `spa_locations` | Chạy `seed-locations.sql` |

---

## Lần sau mở máy — chỉ cần 3 lệnh

```powershell
# 1. Chạy DB
docker start pj-postgres

# 2. Terminal 1
cd pj-be
npm run start:dev

# 3. Terminal 2
cd pj-fe
npm run dev
```

→ Mở `http://localhost:3000`

**Không cần** chạy lại seed, migration. Data đã lưu trong Docker volume.

---

## Cấu trúc dự án

```
Project/
├── pj-be/          # Backend — NestJS + Drizzle + PostgreSQL
│   ├── src/        # Code chính
│   ├── drizzle/    # Migration files
│   ├── seed-*.sql  # Data mẫu
│   ├── .env        # Config (KHÔNG commit)
│   └── package.json
├── pj-fe/          # Frontend — Next.js 16 + Tailwind
│   ├── src/        # Code chính
│   ├── public/     # Ảnh, assets
│   ├── .env.local  # Config (KHÔNG commit)
│   └── package.json
└── HUONG-DAN-CHAY.md
```

---

## Tech stack

| Layer | Công nghệ |
|---|---|
| FE | Next.js 16, React 19, Tailwind CSS, TypeScript |
| BE | NestJS 11, Drizzle ORM, TypeScript |
| DB | PostgreSQL 16 |
| Auth | Chưa có (demo công khai) |