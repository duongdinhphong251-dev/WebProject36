# Cấu trúc dự án và luồng hoạt động

Các thư mục sinh tự động như `node_modules/`, `.next/`, `dist/` không nằm trong cây mã nguồn.

```text
Project/
├── AGENTS.md                 # Hướng dẫn đóng góp
├── README.md                 # Cài đặt, demo, kiểm tra
├── PROJECT_STRUCTURE.md     # Tài liệu này
├── pj-be/
│   ├── .env.example
│   ├── drizzle/
│   │   └── 20260924_restructure.sql
│   ├── scripts/smoke.ts      # Kiểm tra luồng API, tự dọn dữ liệu thử
│   └── src/
│       ├── main.ts           # Khởi động NestJS, ValidationPipe, Swagger
│       ├── app.module.ts     # Đăng ký controller và guard
│       └── core/
│           ├── auth.ts       # Đăng ký, đăng nhập, JWT, phân quyền
│           ├── catalog.ts    # Spa, voucher, thành phố công khai sau đăng nhập
│           ├── member.ts     # Lưu spa, đánh giá, đặt lịch
│           ├── owner.ts      # Quản lý spa/voucher và xem booking
│           ├── admin.ts      # Duyệt nội dung, khóa tài khoản
│           ├── db.ts         # Kết nối PostgreSQL qua Drizzle
│           ├── schema.ts     # Bảng dữ liệu đang dùng
│           ├── setup.ts      # Migration và seed
│           └── validation.spec.ts
└── pj-fe/
    ├── .env.example
    ├── public/favicon.png
    └── src/
        ├── proxy.ts         # Chặn URL khi chưa đăng nhập
        ├── lib/api.ts       # Gọi backend trong Server Component
        ├── components/
        │   ├── AuthForm.tsx
        │   ├── Header.tsx
        │   ├── LogoutButton.tsx
        │   ├── MutationButton.tsx
        │   ├── OwnerForm.tsx
        │   └── SpaActions.tsx
        └── app/
            ├── layout.tsx
            ├── globals.css
            ├── global-error.tsx
            ├── not-found.tsx
            ├── robots.ts
            ├── login/page.tsx
            ├── register/page.tsx
            ├── register/owner/page.tsx
            ├── me/page.tsx
            ├── owner/page.tsx
            ├── admin/page.tsx
            ├── [locale]/layout.tsx
            ├── [locale]/page.tsx
            ├── [locale]/spas/[id]/page.tsx
            ├── [locale]/deals/[id]/page.tsx
            ├── api/auth/[action]/route.ts
            └── api/backend/[...path]/route.ts
```

## Flow

```text
Trình duyệt → proxy (kiểm tra cookie)
             → Next.js Server Component → NestJS JWT guard → Drizzle → PostgreSQL
             → React hiển thị

Form/nút Client Component → Next.js /api/* → NestJS phân quyền → Drizzle → PostgreSQL
```

`/login` và `/register` tạo cookie `httpOnly` chứa JWT bảy ngày. API NestJS kiểm tra token và trạng thái tài khoản trên mọi route khác. User chỉ thấy spa/voucher `approved`; chủ spa tạo nội dung `pending`; admin duyệt rồi nội dung mới hiện trên trang chủ. Bộ lọc thành phố dùng query `?city=ha-noi`; đổi ngôn ngữ chỉ đổi tiền tố `/vi` hoặc `/en`.
