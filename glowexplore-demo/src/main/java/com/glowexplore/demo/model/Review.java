package com.glowexplore.demo.model;

/** Danh gia cua khach hang ve mot provider. */
public class Review {
    private final String authorName;
    private final double rating;
    private final String content;
    private final String reviewedAt;

    public Review(String authorName, double rating, String content, String reviewedAt) {
        this.authorName = authorName;
        this.rating = rating;
        this.content = content;
        this.reviewedAt = reviewedAt;
    }

    public String getAuthorName() {
        return authorName;
    }

    public double getRating() {
        return rating;
    }

    public String getContent() {
        return content;
    }

    public String getReviewedAt() {
        return reviewedAt;
    }
}
