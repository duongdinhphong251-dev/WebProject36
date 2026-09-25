# Cấu trúc dự án và luồng hoạt động

Các thư mục sinh tự động như `node_modules/`, `.next/`, `dist/` không nằm trong cây mã nguồn.

```text
Project/
├── AGENTS.md                 # Hướng dẫn đóng góp
├── README.md                 # Cài đặt, demo, kiểm tra
├── PROJECT_STRUCTURE.md     # Tài liệu này
├── TEAM_GUIDE.md            # Phân công 6 người và hướng dẫn học code
├── TEST_REPORT.md           # Kết quả sau tối ưu và giới hạn kiểm tra
├── .gitignore
├── pj-be/
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── package.json         # Lệnh và dependency backend
│   ├── package-lock.json    # Phiên bản dependency đã khóa
│   ├── nest-cli.json
│   ├── eslint.config.mjs
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── drizzle/
│   │   └── 20260924_restructure.sql
│   ├── scripts/smoke.ts      # Kiểm tra luồng API, tự dọn dữ liệu thử
│   ├── scripts/audit.ts      # Quyền, input sai, trạng thái, dùng voucher đồng thời
│   ├── uploads/              # Ảnh bìa tải lên lúc chạy (không commit)
│   └── src/
│       ├── main.ts           # Khởi động NestJS, ValidationPipe, Swagger
│       ├── app.module.ts     # Đăng ký controller và guard
│       └── core/
│           ├── auth.ts       # Đăng ký, đăng nhập, JWT, phân quyền
│           ├── catalog.ts    # Spa, voucher, thành phố công khai sau đăng nhập
│           ├── member.ts     # Lưu spa, nhận/dùng voucher, đánh giá, đặt lịch
│           ├── owner.ts      # Quản lý spa/voucher, tải ảnh và xem booking
│           ├── ids.ts        # Kiểm tra ID spa tương thích dữ liệu cũ
│           ├── admin.ts      # Duyệt nội dung, khóa tài khoản
│           ├── db.ts         # Kết nối PostgreSQL qua Drizzle
│           ├── schema.ts     # Bảng dữ liệu đang dùng
│           ├── setup.ts      # Migration và seed
│           └── validation.spec.ts
└── pj-fe/
    ├── .env.example
    ├── .gitignore
    ├── .dockerignore
    ├── package.json
    ├── package-lock.json
    ├── next.config.ts       # Standalone và rewrite ảnh về backend
    ├── tsconfig.json
    ├── tsconfig.test.json
    ├── tests/helpers.test.ts # Hồi quy giờ địa phương và gửi form
    ├── eslint.config.mjs
    ├── postcss.config.mjs
    ├── Dockerfile           # Đóng gói frontend, dùng API_URL
    ├── docker-compose.yml  # Chỉ frontend, không phải toàn hệ thống
    ├── public/
    │   ├── favicon.png     # Ảnh favicon cũ
    │   └── assets/
    │       ├── images/common/logo_x.png  # Logo nhóm hiện dùng
    │       └── category/
    │           ├── massage-spa.png
    │           └── lam-dep.png
    └── src/
        ├── proxy.ts         # Chặn URL khi chưa đăng nhập
        ├── lib/
        │   ├── api.ts       # Đọc backend trong Server Component
        │   ├── client-api.ts # Gửi form, upload, xử lý lỗi dùng chung
        │   └── date-time.ts # Chuyển giờ địa phương và ISO UTC
        ├── components/
        │   ├── AuthForm.tsx
        │   ├── Header.tsx
        │   ├── Footer.tsx
        │   ├── CatalogCards.tsx
        │   ├── LogoutButton.tsx
        │   ├── MutationButton.tsx
        │   ├── OwnerForm.tsx
        │   ├── OwnerFields.tsx # SpaFields và DealFields giữ UI hiện tại
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
Chọn ảnh bìa → Next.js /api/backend → NestJS lưu pj-be/uploads → Next.js /uploads/* hiển thị ảnh
```

`/login` và `/register` tạo cookie `httpOnly` chứa JWT bảy ngày. API NestJS kiểm tra token và trạng thái tài khoản trên mọi route khác. User chỉ thấy spa/voucher `approved`; chủ spa tạo nội dung `pending`; admin duyệt rồi nội dung mới hiện trên trang chủ. User nhận voucher vào `/me`, sau đó dùng một lần khi đặt lịch từ trang voucher. Bộ lọc thành phố dùng query `?city=ha-noi`; đổi ngôn ngữ chỉ đổi tiền tố `/vi` hoặc `/en`.

Các file cấu hình riêng `.env` (backend), `.env.local` (frontend) không đưa vào cây để tránh nhầm với template cần commit. `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next`, `.test-dist`, `dist` là file/thư mục sinh tự động. Dữ liệu PostgreSQL nằm ngoài cây source. Xem [TEAM_GUIDE.md](TEAM_GUIDE.md) cho sơ đồ bảng và giải thích từng luồng; xem [TEST_REPORT.md](TEST_REPORT.md) trước khi demo để biết các ca đã đạt và những giới hạn chưa kiểm tra.
