'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function SmartRedirector() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // LƯU Ý: giá trị này phải khớp với timeout tương ứng ở src/app/layout.tsx.
    // Đây là lưới an toàn cho trường hợp JS lỗi/route không mount được — KHÔNG ảnh hưởng
    // tốc độ hiển thị của user bình thường (họ luôn được unhide sớm hơn qua pathname effect).
    const fallbackTimer = setTimeout(() => {
      document.documentElement.style.visibility = '';
    }, 6000);

    const redirectUrl = sessionStorage.getItem('smart_redirect_url');
    if (redirectUrl) {
      sessionStorage.removeItem('smart_redirect_url');
      router.push(redirectUrl);
    } else {
      // Không có redirect nào cần xử lý — đảm bảo màn hình luôn hiện (phòng trường hợp visibility bị ẩn nhầm ở lần load trước)
      document.documentElement.style.visibility = '';
      clearTimeout(fallbackTimer);
    }

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [router, pathname]);

  return null;
}
