import { Star } from "lucide-react";

/** Render 5 sao phản ánh đúng ratingValue, hỗ trợ partial star (ví dụ 4.3 ★★★★☆) */
export function RatingStars({
  value,
  size = "sm",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const sz =
    size === "lg" ? "h-6 w-6" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = Math.min(1, Math.max(0, value - i));
        return (
          <span key={i} className="relative inline-block shrink-0">
            {/* Nền sao trống */}
            <Star className={`${sz} fill-none text-gray-300`} />
            {/* Phần filled theo tỉ lệ */}
            {filled > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${filled * 100}%` }}
              >
                <Star className={`${sz} fill-warning-400 text-warning-400`} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
