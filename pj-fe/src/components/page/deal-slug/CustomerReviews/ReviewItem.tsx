import Link from 'next/link';
import { Star, ThumbsUp, Share2 } from 'lucide-react';
import type { SpaReviewDto } from '@/types/deal-detail';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReviewPhotoGrid } from './ReviewPhotoGrid';

interface ReviewItemProps {
  review: SpaReviewDto;
  responseLabel: string;
  likeLabel: string;
  shareLabel: string;
  daysAgoLabel: (count: number) => string;
  monthsAgoLabel: (count: number) => string;
  justNowLabel: string;
  isLast: boolean;
  mapsUrl?: string;
  /** URL mở tab reviews của Google Maps — dùng cho nút Thích */
  reviewsUri?: string | null;
  /** URL viết review trên Google Maps — dùng cho nút Chia sẻ */
  writeAReviewUri?: string | null;
}

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}


function getRelativeTime(
  isoDate: string,
  daysAgo: (n: number) => string,
  monthsAgo: (n: number) => string,
  justNow: string,
) {
  const parsed = Date.parse(isoDate);
  if (!Number.isFinite(parsed)) return justNow;

  const diffMs = Date.now() - parsed;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(days) || days < 0) return justNow;
  if (days === 0) return justNow;
  if (days < 30) return daysAgo(days);

  const months = Math.floor(days / 30);
  if (!Number.isFinite(months) || months < 1) return daysAgo(Math.min(days, 29));
  return monthsAgo(months);
}

export function ReviewItem({
  review,
  responseLabel,
  likeLabel,
  shareLabel,
  daysAgoLabel,
  monthsAgoLabel,
  justNowLabel,
  isLast,
  mapsUrl = '#',
  reviewsUri,
  writeAReviewUri,
}: ReviewItemProps) {
  const timeAgo = getRelativeTime(
    review.createdAt,
    daysAgoLabel,
    monthsAgoLabel,
    justNowLabel,
  );

  return (
    <div>
      {/* Author row */}
      <div className="flex items-center gap-2 pt-3">
        <Avatar className="h-8 w-8 shrink-0 rounded-full overflow-hidden bg-gray-100">
          {review.authorAvatarUrl && (
            <AvatarImage src={review.authorAvatarUrl} alt={review.authorName} className="object-cover" />
          )}
          <AvatarFallback className={`text-white text-xs font-bold border-none ${getAvatarColor(review.authorName)}`}>
            {review.authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Author name — Figma: 12px Regular #393939 */}
          <p className="text-xs text-[#393939] truncate">{review.authorName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {review.source !== 'reddit' && Array.from({ length: 5 }).map((_, i) => {
              const filled = Number.isFinite(review.ratingValue)
                ? i < Math.min(5, Math.max(0, review.ratingValue))
                : false;
              return (
                <Star
                  key={i}
                  className={`h-3 w-3 ${filled ? 'fill-warning-400 text-warning-400' : 'text-gray-200 fill-gray-200'}`}
                />
              );
            })}
            {/* Time — Figma: 12px Regular Gray/700 #414651, inline after stars */}
            <span className="ml-1 text-xs text-gray-700">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>

      {/* Content — Figma: 14px Regular Gray/800 #252b37, lineHeight 150% */}
      {review.content ? (
        <p className="mt-2 text-sm leading-relaxed text-[#252b37]">
          {review.content}
        </p>
      ) : null}

      {/* Photos — 2 col landscape grid */}
      <ReviewPhotoGrid photos={review.photos} />

      {/* Like + Share — Figma: py-3 pl-6 gap-6, 14px Medium Gray/700 */}
      {review.source !== 'reddit' && (
        <div className="flex items-center gap-6 py-3 pl-6">
          {/* Nút Thích — ưu tiên googleMapsUri của review, fallback reviewsUri / mapsUrl */}
          {(() => {
            const likeHref = review.googleMapsUri ?? reviewsUri ?? (mapsUrl !== '#' ? mapsUrl : null);
            return likeHref ? (
              <Link
                href={likeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
              >
                <ThumbsUp className="h-4 w-4" />
                {likeLabel}
              </Link>
            ) : (
              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <ThumbsUp className="h-4 w-4" />
                {likeLabel}
              </button>
            );
          })()}

          {/* Nút Chia sẻ — ưu tiên googleMapsUri của review, fallback writeAReviewUri / mapsUrl */}
          {(() => {
            const shareHref = review.googleMapsUri ?? writeAReviewUri ?? (mapsUrl !== '#' ? mapsUrl : null);
            return shareHref ? (
              <Link
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:opacity-80 transition-opacity"
              >
                <Share2 className="h-4 w-4" />
                {shareLabel}
              </Link>
            ) : (
              <button className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Share2 className="h-4 w-4" />
                {shareLabel}
              </button>
            );
          })()}
        </div>
      )}

      {/* Owner response — Figma: border-left Gray/300 #d5d7da, pl-4 */}
      {review.ownerResponse && (
        <div className="mb-3 border-l-2 pl-4" style={{ borderColor: '#d5d7da' }}>
          <p className="text-sm font-medium text-gray-950">{responseLabel}</p>
          <p className="mt-1 text-sm text-[#252b37] leading-relaxed">
            {review.ownerResponse.content}
          </p>
        </div>
      )}

      {/* Separator between items */}
      {!isLast && <div className="h-px bg-gray-200" />}
    </div>
  );
}
