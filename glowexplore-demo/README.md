# GlowExplore Demo (Java / Spring Boot)

Đây là **bản rút gọn** của dự án GlowExplore (bản thật viết bằng Next.js + NestJS),
chỉ giữ lại 2 trang để thuyết trình:

1. **Trang danh sách provider** — `/providers` (lọc theo thành phố / dịch vụ, sắp xếp theo rating)
2. **Trang chi tiết provider (spa)** — `/providers/{slug}`

Dữ liệu là dữ liệu mẫu nạp sẵn trong bộ nhớ (xem `ProviderRepository.java`),
**không** kết nối tới database production thật — an toàn để demo trước lớp.

## Cách chạy

Cần cài sẵn **Java 17+** và **Maven** trên máy (khi chạy `mvn`, Maven sẽ tự tải các
thư viện Spring Boot qua internet trong lần chạy đầu).

```bash
cd glowexplore-demo
mvn spring-boot:run
```

Sau đó mở trình duyệt: http://localhost:8080

Muốn build ra file `.jar` chạy độc lập:

```bash
mvn clean package
java -jar target/glowexplore-demo-1.0.0.jar
```

## Cấu trúc project

```
src/main/java/com/glowexplore/demo/
├── GlowExploreDemoApplication.java   # điểm khởi động Spring Boot
├── model/
│   ├── Provider.java     # tương đương SpaDetailDto bên bản thật (rút gọn field)
│   ├── Deal.java         # tương đương DealCardDto
│   ├── Review.java       # tương đương SpaReviewDto
│   └── OpeningHour.java  # tương đương OpeningPeriodDto
├── repository/
│   └── ProviderRepository.java  # "DB" giả lập, tương đương SpasService/PagesService
└── controller/
    └── ProviderController.java  # 2 route: GET /providers, GET /providers/{slug}

src/main/resources/
├── templates/providers/
│   ├── list.html     # tương đương ServiceCategoryPage.tsx + SpaListingCard.tsx
│   └── detail.html   # tương đương SpaDetailPage.tsx
└── static/css/style.css
```

## Đối chiếu với dự án thật (để giải thích với thầy cô)

| Bản thật (GlowExplore)                                   | Bản demo (Java)                          |
|-----------------------------------------------------------|-------------------------------------------|
| NestJS `SpasController` / `PagesController`                | `ProviderController` (Spring MVC)         |
| `SpasService` / `PagesService` (query Postgres qua Drizzle)| `ProviderRepository` (list trong bộ nhớ)  |
| React/Next.js `ServiceCategoryPage.tsx`, `SpaListingCard.tsx` | Thymeleaf `list.html`                  |
| React/Next.js `SpaDetailPage.tsx`                          | Thymeleaf `detail.html`                   |
| `SpaDetailDto`, `DealCardDto`, `SpaReviewDto`               | `Provider`, `Deal`, `Review` (POJO)       |

Phần lọc theo thành phố/dịch vụ + sắp xếp theo rating trong `ProviderRepository.search()`
minh hoạ lại ý tưởng cốt lõi của `resolvePage()` bên bản thật, đã bỏ bớt phần SEO,
flash-sale, phân trang server-side, đa ngôn ngữ... để tập trung vào luồng chính:
**người dùng lọc danh sách → click vào 1 provider → xem chi tiết**.

## Lưu ý khi thuyết trình

- Đây **không phải** bản port 1-1 của code thật — vì công nghệ khác nhau (TypeScript/React
  vs Java/Spring), việc "convert" tự động không khả thi. Đây là bản viết lại, giữ đúng ý
  tưởng luồng và cấu trúc dữ liệu chính.
- Có thể nhấn mạnh: kiến trúc MVC (Model - Repository - Controller - View) áp dụng được
  ở cả 2 công nghệ, chỉ khác cú pháp/framework.
