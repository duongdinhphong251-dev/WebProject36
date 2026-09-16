\# Nhom36 — Web tìm kiếm spa \& deal



Web project cho phép người dùng tìm kiếm voucer spa theo khu vực

hỗ trợ tiếng việt, tiếng anh 


\## Tech 

| Layer | Công nghệ |

|---|---|

| \*\*Frontend\*\* | Next.js 16, React 19, TypeScript, Tailwind CSS |

| \*\*Backend\*\* | NestJS 11, Drizzle ORM, TypeScript |

| \*\*Database\*\* | PostgreSQL 16 |

| \*\*Runtime\*\* | Node.js >= 20 |



\## cấu trúc dự án 

Project/

├── pj-be/ # Backend — NestJS + Drizzle

│ ├── src/ # Code chính

│ │ ├── modules/ # Các module nghiệp vụ (spas, deals, services, ...)

│ │ ├── db/ # Schema + kết nối DB

│ │ └── common/ # Utilities dùng chung

│ ├── drizzle/ # Migration files

│ ├── seed-demo.sql # Data mẫu (spas, deals, banners, cities)

│ ├── seed-locations.sql# Data mẫu (spa\_locations)

│ └── .env.example # Mẫu config

├── pj-fe/ # Frontend — Next.js

│ ├── src/

│ │ ├── app/ # Routes (App Router)

│ │ ├── components/ # UI components

│ │ ├── services/ # Gọi API BE

│ │ └── i18n/ # Đa ngôn ngữ (vi/en)

│ ├── public/ # Ảnh, assets

│ └── .env.exemple # Mẫu config

├── HUONG-DAN-CHAY.md # Hướng dẫn chạy chi tiết

└── README.md # File này



\## tính năng 

\- 🏠 \*\*Trang chủ:\*\* banner quảng cáo, 4 danh mục dịch vụ chính, spa gợi ý ( hiện tại chỉ có 1 dịch vụ) 

\- 🔍 \*\*Tìm kiếm spa theo khu vực:\*\* lọc theo thành phố, giá, rating

\- 💆 \*\*Chi tiết spa:\*\* thông tin, hình ảnh, đánh giá

\- 🎁 \*\*Deal/khuyến mãi:\*\* hiển thị các ưu đãi đang chạy

\- 🌐 \*\*Đa ngôn ngữ:\*\* Tiếng Việt, English



\## workflow 

User

│

▼

Frontend (Next.js) ← port 3000

│

│ HTTP API call

▼

Backend (NestJS) ← port 8081

│

│ SQL query

▼

Database (PostgreSQL) ← port 5433



\*\*In simple terms:\*\*

\- \*\*Frontend\*\* displays the UI to users.

\- \*\*Backend\*\* handles logic and fetches data from the database.

\- \*\*Database\*\* stores all information (spas, deals, cities, banners...).

\- Frontend calls Backend over HTTP, Backend reads Database and returns the result.



\---



\## Example Flow



\*\*User opens `/massage-spa/ha-noi`:\*\*



1\. Frontend receives the URL and calls the Backend API.

2\. Backend looks up the `city\_id` for Hanoi.

3\. Backend fetches massage deals in Hanoi.

4\. Backend returns JSON to Frontend.

5\. Frontend renders the spa + deal list.



\---



\- For setup and run instructions, see `Nhom36.md`.







