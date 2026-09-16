export interface ExtraAttrItem {
  key: string;
  label: string;
}

export const SPA_EXTRA_ATTRS: Record<number, ExtraAttrItem[]> = {
  42: [ // Ăn & Uống
    { key: "is_halal", label: "Đạt chuẩn Halal" },
    { key: "has_private_room", label: "Có phòng riêng" },
    { key: "has_vegan_options", label: "Có món chay" },
    { key: "has_english_menu", label: "Có menu tiếng Anh" },
  ],
  44: [ // Di chuyển
    { key: "available_24_7", label: "Phục vụ 24/7" },
    { key: "english_speaking_driver", label: "Tài xế nói tiếng Anh" },
  ],
  45: [ // Lưu trú
    { key: "has_swimming_pool", label: "Có bể bơi" },
    { key: "has_gym", label: "Có phòng gym" },
  ],
};

export const DEAL_EXTRA_ATTRS: Record<number, ExtraAttrItem[]> = {
  44: [ // Di chuyển
    { key: "is_private_car", label: "Xe riêng (không ghép)" },
    { key: "airport_pickup", label: "Đã bao gồm phí sân bay" },
  ],
  45: [ // Lưu trú
    { key: "has_breakfast", label: "Bao gồm bữa sáng" },
    { key: "free_cancellation", label: "Hủy miễn phí" },
    { key: "suitable_long_stay", label: "Phù hợp ở dài ngày" },
  ],
};

