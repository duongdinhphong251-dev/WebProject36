# Hướng dẫn chạy dự án Nhom36

Web tìm kiếm spa, dịch vụ làm đẹp và ưu đãi theo khu vực.

---

## Yêu cầu cài đặt

- **Node.js** >= 20 — https://nodejs.org
- **Docker Desktop** — https://www.docker.com/products/docker-desktop

Kiểm tra:

```powershell
node --version
npm --version
docker --version
```

---

## Bước 1 — Clone repo

```powershell
git clone 
cd Project
```

---

## Bước 2 — Chạy PostgreSQL bằng Docker

```powershell
docker run --name pj-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=tuoi_db `
  -p 5433:5432 `
  -d postgres:16
```

> Dùng port **5433** để tránh conflict với Postgres native nếu có.

Kiểm tra container đang chạy:

```powershell
docker ps
```

Mong đợi: `pj-postgres` ở trạng thái `Up`.

---

## Bước 3 — Tạo file `.env` cho BE

```powershell
cd pj-be
notepad .env
```

Dán nội dung:

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

---

## Bước 4 — Tạo file `.env.local` cho FE

```powershell
cd ..\pj-fe
copy .env.exemple .env.local
notepad .env.local
```

Đảm bảo nội dung:

```env
NEXT_PUBLIC_APP_NAME="Nhom36"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API="http://localhost:8081"
NODE_ENV="development"
```


---

## Bước 5 — Cài dependencies

```powershell
cd ..\pj-be
npm install

cd ..\pj-fe
npm install
```

Mỗi bên mất 1-2 phút.

---

## Bước 6 — Tạo bảng trong DB

```powershell
cd ..\pj-be
npx drizzle-kit push --config=drizzle.config.ts
```

---

## Bước 7 — Import data mẫu (QUAN TRỌNG)

```powershell
Get-Content seed-full.sql | docker exec -i pj-postgres psql -U postgres -d tuoi_db
```

> File `seed-full.sql` chứa toàn bộ data: spas, deals, banners, cities, seo_nodes.
> Nếu bỏ qua bước này → web sẽ trắng, 404.

Verify:

```powershell
docker exec pj-postgres psql -U postgres -d tuoi_db -c "SELECT COUNT(*) FROM spas;"
```

Mong đợi: `3`

```powershell
docker exec pj-postgres psql -U postgres -d tuoi_db -c "SELECT url FROM seo_nodes;"
```

Mong đợi thấy `massage-spa` trong danh sách.

---

## Bước 8 — Chạy dự án

### Terminal 1 — Backend

```powershell
cd pj-be
npm run start:dev
```

Đợi tới khi thấy:

```
Application is running on: http://localhost:8081
```


### Terminal 2 — Frontend

Mở terminal mới trong VS Code (`Ctrl + Shift + \``):

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

Mở browser: **http://localhost:3000**

---

## Lần sau mở máy — chỉ cần 3 bước

```powershell
docker start pj-postgres
```

Terminal 1:

```powershell
cd pj-be
npm run start:dev
```

Terminal 2:

```powershell
cd pj-fe
npm run dev
```

Mở `http://localhost:3000`

> Không cần chạy lại seed / migration. Data đã lưu trong Docker volume.



## Cấu trúc dự án

```
Project/
├── pj-be/                # Backend — NestJS + Drizzle
│   ├── src/              # Code chính
│   ├── drizzle/          # Migration files
│   ├── seed-full.sql     # Data mẫu
│   ├── .env              # Config (không commit)
│   └── package.json
├── pj-fe/                # Frontend — Next.js 16 + Tailwind
│   ├── src/              # Code chính
│   ├── public/           # Ảnh, assets
│   ├── .env.local        # Config (không commit)
│   └── package.json
├── HUONG-DAN-CHAY.md
└── README.md
```

---

## Tech stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, TypeScript |
| Backend | NestJS 11, Drizzle ORM, TypeScript |
| Database | PostgreSQL 16 (Docker) |
| Runtime | Node.js >= 20 |

---

## API endpoints chính

Backend chạy ở `http://localhost:8081/api/v1`

| Endpoint | Mô tả |
|---|---|
| `GET /spas/recommended` | Danh sách spa gợi ý |
| `GET /spas/:slug` | Chi tiết spa |
| `GET /deals` | Danh sách deal |
| `GET /deals/:idOrSlug` | Chi tiết deal |
| `GET /locations/cities` | Danh sách thành phố |
| `GET /banners?placement=home_slot` | Banner trang chủ |

**Swagger UI:** http://localhost:8081/api/docs