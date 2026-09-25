// datetime-local expects wall-clock time, whereas API timestamps use UTC.
export function toLocalDateTime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toIsoDateTime(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
