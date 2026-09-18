package com.glowexplore.demo.model;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

/**
 * Ban rut gon cua "Spa"/"Provider" trong du an that (xem SpaDetailDto ben backend NestJS).
 * Chi giu lai cac truong can cho 2 trang: danh sach va chi tiet.
 */
public class Provider {

    private final Long id;
    private final String slug;
    private final String name;
    private final String description;
    private final String address;
    private final String city;
    private final String district;
    private final String service;       // dich vu chinh, vd "Massage & Spa"
    private final String avatarUrl;
    private final double ratingValue;
    private final int reviewCount;
    private final String phone;
    private final String zaloUrl;
    private final String facebookUrl;
    private final List<String> amenities;
    private final List<String> photos;
    private final List<OpeningHour> openingHours;
    private final List<Deal> deals;
    private final List<Review> reviews;

    public Provider(Long id, String slug, String name, String description, String address,
                     String city, String district, String service, String avatarUrl,
                     double ratingValue, int reviewCount, String phone, String zaloUrl,
                     String facebookUrl, List<String> amenities, List<String> photos,
                     List<OpeningHour> openingHours, List<Deal> deals, List<Review> reviews) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.address = address;
        this.city = city;
        this.district = district;
        this.service = service;
        this.avatarUrl = avatarUrl;
        this.ratingValue = ratingValue;
        this.reviewCount = reviewCount;
        this.phone = phone;
        this.zaloUrl = zaloUrl;
        this.facebookUrl = facebookUrl;
        this.amenities = amenities;
        this.photos = photos;
        this.openingHours = openingHours;
        this.deals = deals;
        this.reviews = reviews;
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getAddress() { return address; }
    public String getCity() { return city; }
    public String getDistrict() { return district; }
    public String getService() { return service; }
    public String getAvatarUrl() { return avatarUrl; }
    public double getRatingValue() { return ratingValue; }
    public int getReviewCount() { return reviewCount; }
    public String getPhone() { return phone; }
    public String getZaloUrl() { return zaloUrl; }
    public String getFacebookUrl() { return facebookUrl; }
    public List<String> getAmenities() { return amenities; }
    public List<String> getPhotos() { return photos; }
    public List<OpeningHour> getOpeningHours() { return openingHours; }
    public List<Deal> getDeals() { return deals; }
    public List<Review> getReviews() { return reviews; }

    /** Deal co % giam gia cao nhat - dung de gan badge o card danh sach. */
    public Deal getBestDeal() {
        return deals.stream()
                .max((a, b) -> Integer.compare(a.getDiscountPercent(), b.getDiscountPercent()))
                .orElse(null);
    }

    /** true neu hien dang trong gio mo cua (dua theo gio he thong). */
    public boolean isOpenNow() {
        DayOfWeek javaDay = java.time.LocalDate.now().getDayOfWeek();
        int today = (javaDay == DayOfWeek.SUNDAY) ? 0 : javaDay.getValue();
        LocalTime now = LocalTime.now();
        return openingHours.stream()
                .filter(h -> h.getDay() == today)
                .anyMatch(h -> {
                    LocalTime open = LocalTime.parse(h.getOpenTime());
                    LocalTime close = LocalTime.parse(h.getCloseTime());
                    return !now.isBefore(open) && !now.isAfter(close);
                });
    }
}
