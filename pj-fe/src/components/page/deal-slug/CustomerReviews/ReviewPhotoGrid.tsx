import Image from 'next/image';
import type { SpaReviewPhotoDto } from '@/types/deal-detail';
import { shouldBypassNextImageOptimization } from '@/libs/spa-image-url';

interface ReviewPhotoGridProps {
  photos?: SpaReviewPhotoDto[] | null;
}

export function ReviewPhotoGrid({ photos }: ReviewPhotoGridProps) {
  const list = photos ?? [];
  if (!list.length) return null;

  const visible = list.slice(0, 4);

  return (
    // Figma: 2-col grid, landscape ~4:3, cornerRadius 16 — giảm height cho compact
    <div className="mt-2 grid grid-cols-2 gap-1.5">
      {visible.map((p) => (
        <div
          key={p.id}
          className="relative w-full overflow-hidden rounded-2xl bg-gray-200"
          style={{ height: '88px' }}
        >
          <Image
            src={p.url}
            alt={`Ảnh đánh giá của khách hàng ${p.id}`}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 280px, 50vw"
            unoptimized={shouldBypassNextImageOptimization(p.url)}
          />
        </div>
      ))}
    </div>
  );
}
