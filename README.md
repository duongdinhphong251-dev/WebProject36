# Nhom36 Spa & Voucher

Dự án môn học gồm Next.js 16/React 19/Tailwind 4 và NestJS 11/Drizzle/PostgreSQL 16. Người dùng đăng nhập trước khi xem spa, voucher. Giao diện hỗ trợ tiếng Việt và tiếng Anh; giá chỉ hiển thị VND.

## Chạy trên máy

Yêu cầu Node.js 20+ và PostgreSQL 16 (Docker có thể mở cổng 5433). Chạy trong PowerShell ở thư mục gốc:

```powershell
docker run --name pj-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tuoi_db -p 5433:5432 -d postgres:16
cd pj-be
Copy-Item .env.example .env
npm ci
npm run db:migrate
npm run start:dev
```

Trong terminal khác:

```powershell
cd pj-fe
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Mở `http://localhost:3000`. Nếu container `pj-postgres` đã tồn tại, dùng `docker start pj-postgres` thay cho `docker run`. Đổi `JWT_SECRET` trong `pj-be/.env` trước khi dùng ngoài máy cá nhân. Lệnh `db:migrate` có thể chạy lại; nó giữ dữ liệu cũ và tạo ba tài khoản demo. Với database trống, lệnh này tạo thêm ba thành phố, spa và voucher mẫu.

## Demo theo vai trò

| Vai trò | Số điện thoại | Mật khẩu | Trang |
|---|---|---|---|
| User | `0900000003` | `User@123456` | `/me` |
| Chủ spa | `0900000002` | `Owner@123456` | `/owner` |
| Admin | `0900000001` | `Admin@123456` | `/admin` |

User xem danh sách `/vi` hoặc `/en`, lọc `?city=ha-noi`, lưu spa, viết đánh giá và đặt lịch. Chủ spa tạo/sửa spa, tạo/sửa/xóa voucher, xem booking và thống kê. Spa/voucher mới chỉ xuất hiện công khai sau khi admin duyệt. Admin xem toàn bộ dữ liệu và khóa/mở khóa tài khoản. Đăng ký người dùng ở `/register`, chủ spa ở `/register/owner`. Swagger: `http://localhost:8081/api/docs`.

## Kiểm tra

```powershell
cd pj-be
npx tsc --noEmit
npm test -- --runInBand
npm run build
npm run lint
npm run test:smoke   # cần backend và PostgreSQL đang chạy; tự dọn dữ liệu thử
```

Với frontend, chạy `npx tsc --noEmit`, `npm run lint`, `npm run build` trong `pj-fe/`. Xem [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) để hiểu cây thư mục và luồng request. Các file `.env` không được commit.
