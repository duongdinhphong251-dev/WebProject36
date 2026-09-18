package com.glowexplore.demo.model;

/** Uu dai / khuyen mai cua mot provider. */
public class Deal {
    private final Long id;
    private final String title;
    private final int discountPercent;
    private final long originalPrice;
    private final long salePrice;

    public Deal(Long id, String title, int discountPercent, long originalPrice, long salePrice) {
        this.id = id;
        this.title = title;
        this.discountPercent = discountPercent;
        this.originalPrice = originalPrice;
        this.salePrice = salePrice;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public int getDiscountPercent() {
        return discountPercent;
    }

    public long getOriginalPrice() {
        return originalPrice;
    }

    public long getSalePrice() {
        return salePrice;
    }
}
