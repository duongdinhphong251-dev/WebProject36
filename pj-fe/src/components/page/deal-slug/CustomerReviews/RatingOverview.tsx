import { getTranslation } from "@/i18n/server-cache";
import { RatingStars } from "./RatingStars";

interface RatingOverviewProps {
  ratingValue: number;
  reviewCount: number;
  locale: string;
}

function getRatingLabelKey(
  score: number,
): "excellent" | "good" | "fair" | "average" | "poor" {
  if (score >= 4.5) return "excellent";
  if (score >= 4.0) return "good";
  if (score >= 3.5) return "fair";
  if (score >= 3.0) return "average";
  return "poor";
}

function getLabelColor(key: ReturnType<typeof getRatingLabelKey>): string {
  const map: Record<typeof key, string> = {
    excellent: "#5B7A4F",
    good: "#1570ef",
    fair: "#b54708",
    average: "#b54708",
    poor: "#b42318",
  };
  return map[key];
}

function GoogleLogo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export async function RatingOverview({
  ratingValue,
  reviewCount,
  locale,
}: RatingOverviewProps) {
  const { t } = await getTranslation(locale, "deal-detail");

  const labelKey = getRatingLabelKey(ratingValue);
  const labelText = t(`reviews.rating_label.${labelKey}`);
  const labelColor = getLabelColor(labelKey);

  return (
    <div
      className="mt-4 flex overflow-hidden rounded-2xl"
      style={{
        border: "1px solid #D6DDD3",
      }}
    >
      {/* Left — score box */}
      <div
        className="flex shrink-0 flex-col items-center justify-center px-5 py-4"
        style={{
          background: "linear-gradient(145deg, #C7D4C0 0%, #AEC2A7 100%)",
          borderRight: "1px solid #AEC2A7",
          minWidth: "88px",
        }}
      >
        <span className="text-[34px] font-extrabold tracking-tight text-[#093E06] leading-none mb-1">
          {Number(ratingValue || 0).toFixed(1)}
        </span>
        <span
          className="mt-1 text-[11px] font-medium"
          style={{ color: "#3B5230" }}
        >
          {t("reviews.out_of_5")}
        </span>
      </div>

      {/* Right — label · stars · count */}
      <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-4">
        <span
          className="text-base font-bold leading-tight"
          style={{ color: labelColor }}
        >
          {labelText}
        </span>

        <RatingStars value={ratingValue} size="md" />

        <div className="flex items-center gap-1.5">
          <GoogleLogo />
          <span className="text-[11px] text-gray-500">
            {reviewCount.toLocaleString(
              locale === "vi" ? "vi-VN" : locale === "ko" ? "ko-KR" : "en-US",
            )}{" "}
            {t("reviews.count_label")}
          </span>
        </div>
      </div>
    </div>
  );
}
