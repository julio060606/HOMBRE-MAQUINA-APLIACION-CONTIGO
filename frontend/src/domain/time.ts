export const PATIENT_ZONE = 'America/Lima';
export function localDate(value: Date | string = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PATIENT_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00-05:00`);
  value.setUTCDate(value.getUTCDate() + days);
  return localDate(value);
}
export const atLima = (date: string, time: string) => new Date(`${date}T${time}:00-05:00`).toISOString();
export const periodStart = (days: number, now = new Date()) => atLima(shiftDate(localDate(now), 1 - days), '00:00');
export function withinPeriod(date: string, days: number, now = new Date()): boolean {
  return Date.parse(date) >= Date.parse(periodStart(days, now)) && Date.parse(date) <= now.getTime();
}
export function formatDate(value: string, withTime = true): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: PATIENT_ZONE, day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(new Date(value.length === 10 ? `${value}T12:00:00-05:00` : value));
}
export const newestFirst = <T extends { recordedAt: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt));
