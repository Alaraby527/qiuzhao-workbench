export function getLocalDateString(d: Date = new Date()): string {
  const offsetMs = d.getTime() + 8 * 60 * 60 * 1000;
  const utcDate = new Date(offsetMs);
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
