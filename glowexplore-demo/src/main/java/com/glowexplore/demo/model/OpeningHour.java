package com.glowexplore.demo.model;

/**
 * Gio mo cua cho 1 ngay trong tuan.
 * day: 0 = Chu nhat, 1 = Thu 2, ..., 6 = Thu 7 (giong quy uoc cua ban goc).
 */
public class OpeningHour {
    private final int day;
    private final String openTime;
    private final String closeTime;

    public OpeningHour(int day, String openTime, String closeTime) {
        this.day = day;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    public int getDay() {
        return day;
    }

    public String getOpenTime() {
        return openTime;
    }

    public String getCloseTime() {
        return closeTime;
    }

    public String getDayLabel() {
        String[] labels = {"Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"};
        return labels[day];
    }
}
