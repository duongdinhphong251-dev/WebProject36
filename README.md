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

Mở `http://localhost:3000`. Nếu container `pj-postgres` đã tồn tại, dùng `docker start pj-postgres` thay cho `docker run`. Đổi `JWT_SECRET` trong `pj-be/.env` trước khi dùng ngoài máy cá nhân. Lệnh `db:migrate` cập nhật schema và tạo ba tài khoản demo nếu chưa có. Migration hiện cũng xóa bảng/cột cũ (banner, tracking, tiếng Hàn); đọc SQL trước khi chạy trên database có dữ liệu cần giữ. Với database trống, lệnh này tạo thêm ba thành phố, spa và voucher mẫu.

## Demo theo vai trò

| Vai trò | Số điện thoại | Mật khẩu | Trang |
|---|---|---|---|
| User | `0900000003` | `User@123456` | `/me` |
| Chủ spa | `0900000002` | `Owner@123456` | `/owner` |
| Admin | `0900000001` | `Admin@123456` | `/admin` |

User xem danh sách `/vi` hoặc `/en`, lọc `?city=ha-noi`, lưu spa, viết đánh giá và đặt lịch. Trên trang voucher, bấm **Nhận voucher**; voucher xuất hiện trong `/me`. Đặt lịch từ trang voucher để sử dụng một lần; lịch của user và chủ spa đều hiển thị tên voucher. Voucher hết hạn hoặc đã dùng không thể đặt lại. Chủ spa tạo/sửa spa và voucher, chọn một ảnh bìa PNG/JPEG/WebP (tối đa 2 MB), xem lịch đặt và thống kê. Ảnh được lưu trong `pj-be/uploads/` trên máy chạy backend. Spa/voucher mới chỉ xuất hiện công khai sau khi admin duyệt. Admin xem toàn bộ dữ liệu và khóa/mở khóa tài khoản. Đăng ký người dùng ở `/register`, chủ spa ở `/register/owner`. Swagger: `http://localhost:8081/api/docs`.

## Kiểm tra

```powershell
cd pj-be
npx tsc --noEmit
npm test -- --runInBand
npm run build
npm run lint
npm run test:smoke   # cần backend và PostgreSQL đang chạy; tự dọn dữ liệu thử
npm run test:audit   # 40 kiểm tra quyền, input, trạng thái và request đồng thời
```

Với frontend, chạy `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` trong `pj-fe/`. Xem [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) để hiểu cây thư mục và luồng request. Các file `.env` không được commit.
