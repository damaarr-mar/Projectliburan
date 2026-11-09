import type { Booking } from "../types/booking.ts";

const KEY = "workshop-bookings";

export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

export function saveBookings(bookings: Booking[]): void {
  localStorage.setItem(KEY, JSON.stringify(bookings));
}
