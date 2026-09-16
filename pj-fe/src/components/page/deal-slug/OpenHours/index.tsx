import type { SpaOpeningHourDto } from "@/types/deal-detail";

import { OpenHoursToggle } from "./OpenHoursToggle";
import { getTranslation } from "@/i18n/server-cache";

interface OpenHoursProps {
  hours: SpaOpeningHourDto[];
  locale: string;
}

export async function OpenHours({ hours, locale }: OpenHoursProps) {
  const { t } = await getTranslation(locale, "deal-detail");

  const dayLabels: Record<string, string> = {
    monday: t("open_hours.days.monday"),
    tuesday: t("open_hours.days.tuesday"),
    wednesday: t("open_hours.days.wednesday"),
    thursday: t("open_hours.days.thursday"),
    friday: t("open_hours.days.friday"),
    saturday: t("open_hours.days.saturday"),
    sunday: t("open_hours.days.sunday"),
  };

  return (
    <div>
      <div className="h-px bg-gray-200" />
      <OpenHoursToggle
        hours={hours}
        title={t("open_hours.title")}
        notAvailable={t("open_hours.not_available")}
        closedLabel={t("open_hours.closed")}
        dayLabels={dayLabels}
      />
      <div className="h-px bg-gray-200" />
    </div>
  );
}
