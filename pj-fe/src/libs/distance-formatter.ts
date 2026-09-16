/**
 * Định dạng khoảng cách theo chuẩn tiếng Việt:
 * - Nếu km >= 1: "1,2 km" (dùng dấu phẩy thập phân, 1 chữ số sau dấu phẩy)
 * - Nếu km < 1: "800 m" (đổi sang mét nếu dưới 1 km)
 */
export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km) || km < 0) return "";
  if (km < 1) {
    const meters = Math.round(km * 1000);
    if (meters < 50) return "< 50 m";
    return `${meters} m`;
  }
  return `${Number(km || 0).toFixed(1).replace(".", ",")} km`;
}
