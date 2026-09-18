package com.glowexplore.demo.repository;

import com.glowexplore.demo.model.Deal;
import com.glowexplore.demo.model.OpeningHour;
import com.glowexplore.demo.model.Provider;
import com.glowexplore.demo.model.Review;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * "Database" gia lap: nap san mot danh sach Provider trong bo nho khi app khoi dong.
 * Trong ban that, lop nay tuong duong SpasService + PagesService goi Postgres qua Drizzle.
 */
@Repository
public class ProviderRepository {

    private final List<Provider> providers = new ArrayList<>();

    public ProviderRepository() {
        seed();
    }

    public List<Provider> findAll() {
        return providers;
    }

    public Optional<Provider> findBySlug(String slug) {
        return providers.stream().filter(p -> p.getSlug().equals(slug)).findFirst();
    }

    public List<String> findAllCities() {
        return providers.stream().map(Provider::getCity).distinct().sorted().collect(Collectors.toList());
    }

    public List<String> findAllServices() {
        return providers.stream().map(Provider::getService).distinct().sorted().collect(Collectors.toList());
    }

    /**
     * Tuong duong ban rut gon cua PagesService.resolvePage(): loc theo thanh pho/dich vu,
     * roi sap xep theo rating hoac so luot danh gia.
     */
    public List<Provider> search(String city, String service, String sortBy) {
        List<Provider> result = providers.stream()
                .filter(p -> city == null || city.isBlank() || p.getCity().equalsIgnoreCase(city))
                .filter(p -> service == null || service.isBlank() || p.getService().equalsIgnoreCase(service))
                .collect(Collectors.toList());

        Comparator<Provider> comparator = switch (sortBy == null ? "" : sortBy) {
            case "reviewCount" -> Comparator.comparingInt(Provider::getReviewCount).reversed();
            default -> Comparator.comparingDouble(Provider::getRatingValue).reversed();
        };
        result.sort(comparator);
        return result;
    }

    private void seed() {
        providers.add(new Provider(
                1L, "bong-spa-quan-1", "Bống Spa & Wellness",
                "Không gian thư giãn chuẩn 5 sao giữa trung tâm Quận 1, chuyên massage body và chăm sóc da mặt "
                        + "bằng tinh dầu thiên nhiên. Đội ngũ kỹ thuật viên được đào tạo bài bản.",
                "12 Lê Lợi, Phường Bến Nghé", "TP. Hồ Chí Minh", "Quận 1", "Massage & Spa",
                "https://picsum.photos/seed/bong-spa/400/300",
                4.8, 1240, "0901234567", "https://zalo.me/0901234567", "https://facebook.com/bongspa",
                List.of("Phòng xông hơi", "Bãi đỗ xe", "Wifi miễn phí", "Điều hòa"),
                List.of(
                        "https://picsum.photos/seed/bong-spa-1/800/500",
                        "https://picsum.photos/seed/bong-spa-2/800/500",
                        "https://picsum.photos/seed/bong-spa-3/800/500"),
                List.of(
                        new OpeningHour(0, "09:00", "21:00"), new OpeningHour(1, "09:00", "22:00"),
                        new OpeningHour(2, "09:00", "22:00"), new OpeningHour(3, "09:00", "22:00"),
                        new OpeningHour(4, "09:00", "22:00"), new OpeningHour(5, "09:00", "22:00"),
                        new OpeningHour(6, "09:00", "22:00")),
                List.of(
                        new Deal(101L, "Massage body 60 phút", 30, 500_000, 350_000),
                        new Deal(102L, "Chăm sóc da mặt + xông hơi", 20, 400_000, 320_000)),
                List.of(
                        new Review("Thu Hà", 5, "Không gian sạch sẽ, nhân viên chuyên nghiệp, sẽ quay lại.", "2 ngày trước"),
                        new Review("Minh Tuấn", 4.5, "Giá hợp lý so với chất lượng dịch vụ.", "1 tuần trước"))
        ));

        providers.add(new Provider(
                2L, "serenity-spa-cau-giay", "Serenity Spa Cầu Giấy",
                "Serenity mang phong cách spa Hàn Quốc, nổi bật với liệu trình chăm sóc da mặt công nghệ cao "
                        + "và dịch vụ foot massage thư giãn sau giờ làm việc.",
                "88 Trần Duy Hưng", "Hà Nội", "Cầu Giấy", "Massage & Spa",
                "https://picsum.photos/seed/serenity-spa/400/300",
                4.6, 860, "0987654321", "https://zalo.me/0987654321", "https://facebook.com/serenityspa",
                List.of("Trà thảo mộc miễn phí", "Phòng riêng tư", "Wifi miễn phí"),
                List.of(
                        "https://picsum.photos/seed/serenity-1/800/500",
                        "https://picsum.photos/seed/serenity-2/800/500"),
                List.of(
                        new OpeningHour(0, "10:00", "20:00"), new OpeningHour(1, "09:30", "21:30"),
                        new OpeningHour(2, "09:30", "21:30"), new OpeningHour(3, "09:30", "21:30"),
                        new OpeningHour(4, "09:30", "21:30"), new OpeningHour(5, "09:30", "22:00"),
                        new OpeningHour(6, "09:30", "22:00")),
                List.of(
                        new Deal(201L, "Foot massage 45 phút", 15, 300_000, 255_000)),
                List.of(
                        new Review("Lan Anh", 5, "Foot massage rất đã, nhân viên nhẹ nhàng.", "3 ngày trước"))
        ));

        providers.add(new Provider(
                3L, "beauty-house-hai-chau", "Beauty House Hải Châu",
                "Chuyên chăm sóc tóc và da tổng thể, phù hợp cho khách muốn làm mới diện mạo trước sự kiện quan trọng.",
                "45 Bạch Đằng", "Đà Nẵng", "Hải Châu", "Làm đẹp",
                "https://picsum.photos/seed/beauty-house/400/300",
                4.3, 410, "0912345678", null, "https://facebook.com/beautyhouse",
                List.of("Gửi xe miễn phí", "Nước uống miễn phí"),
                List.of("https://picsum.photos/seed/beauty-house-1/800/500"),
                List.of(
                        new OpeningHour(0, "08:30", "20:00"), new OpeningHour(1, "08:00", "20:30"),
                        new OpeningHour(2, "08:00", "20:30"), new OpeningHour(3, "08:00", "20:30"),
                        new OpeningHour(4, "08:00", "20:30"), new OpeningHour(5, "08:00", "21:00"),
                        new OpeningHour(6, "08:00", "21:00")),
                List.of(
                        new Deal(301L, "Uốn/nhuộm tóc trọn gói", 25, 800_000, 600_000),
                        new Deal(302L, "Chăm sóc da mặt cơ bản", 10, 250_000, 225_000)),
                List.of(
                        new Review("Ngọc Diễm", 4, "Thợ làm tóc tay nghề tốt, giá ổn.", "5 ngày trước"))
        ));

        providers.add(new Provider(
                4L, "an-spa-quan-3", "An Spa Quận 3",
                "Không gian yên tĩnh, phù hợp cho khách muốn thư giãn sau giờ làm với liệu trình massage đá nóng "
                        + "và tắm trắng body.",
                "20 Võ Văn Tần", "TP. Hồ Chí Minh", "Quận 3", "Massage & Spa",
                "https://picsum.photos/seed/an-spa/400/300",
                4.9, 2050, "0933112233", "https://zalo.me/0933112233", null,
                List.of("Phòng VIP", "Xông hơi đá muối", "Bãi đỗ xe"),
                List.of(
                        "https://picsum.photos/seed/an-spa-1/800/500",
                        "https://picsum.photos/seed/an-spa-2/800/500",
                        "https://picsum.photos/seed/an-spa-3/800/500"),
                List.of(
                        new OpeningHour(0, "09:00", "22:00"), new OpeningHour(1, "09:00", "22:30"),
                        new OpeningHour(2, "09:00", "22:30"), new OpeningHour(3, "09:00", "22:30"),
                        new OpeningHour(4, "09:00", "22:30"), new OpeningHour(5, "09:00", "23:00"),
                        new OpeningHour(6, "09:00", "23:00")),
                List.of(
                        new Deal(401L, "Massage đá nóng 90 phút", 35, 700_000, 455_000)),
                List.of(
                        new Review("Hoàng Nam", 5, "Dịch vụ tốt nhất mình từng trải nghiệm ở Sài Gòn.", "1 ngày trước"),
                        new Review("Bảo Trâm", 5, "Nhân viên tận tâm, sẽ giới thiệu bạn bè.", "4 ngày trước"))
        ));
    }
}
