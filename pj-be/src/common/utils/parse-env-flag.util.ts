/** yes/true/1/on (default) vs no/false/0/off */
export function parseEnvFlag(value: string | undefined, defaultValue = true): boolean {
  const v = value?.trim().toLowerCase();
  if (!v) return defaultValue;
  if (['yes', 'true', '1', 'on', 'y'].includes(v)) return true;
  if (['no', 'false', '0', 'off', 'n'].includes(v)) return false;
  return defaultValue;
}
