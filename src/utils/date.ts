export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isPastDate(date: string): boolean {
  return date < todayString();
}

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"] as const;

export function operatingHours(): readonly string[] {
  return HOURS;
}

export function isOperatingHour(time: string): boolean {
  return (HOURS as readonly string[]).includes(time);
}
