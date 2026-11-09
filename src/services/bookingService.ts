import type { Booking, BookingInput, BookingStatus } from "../types/booking.ts";
import { isOperatingHour, isPastDate } from "../utils/date.ts";
import { loadBookings, saveBookings } from "../utils/storage.ts";

const delay = (ms = 450): Promise<void> => new Promise((r) => setTimeout(r, ms));

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** K2: fungsi murni pengecek bentrok slot. */
export function hasConflict(
  bookings: Booking[],
  date: string,
  time: string,
  excludeId?: string,
): boolean {
  return bookings.some(
    (b) =>
      b.id !== excludeId &&
      b.date === date &&
      b.time === time &&
      b.status !== "dibatalkan" &&
      b.status !== "selesai",
  );
}

export function validateInput(input: Partial<BookingInput>): string | null {
  if (!input.customerName?.trim()) return "Nama pelanggan wajib diisi.";
  if (!input.vehicle?.plateNumber?.trim()) return "Plat nomor wajib diisi.";
  if (!input.vehicle?.model?.trim()) return "Model kendaraan wajib diisi.";
  if (!input.vehicle?.type) return "Jenis kendaraan wajib dipilih.";
  if (!input.service) return "Jenis layanan wajib dipilih.";
  if (!input.date) return "Tanggal wajib dipilih.";
  if (isPastDate(input.date)) return "Tanggal booking tidak boleh di masa lalu.";
  if (!input.time) return "Jam wajib dipilih.";
  if (!isOperatingHour(input.time)) return "Jam di luar jam operasional (08:00–16:00).";
  return null;
}

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  terjadwal: ["dikerjakan", "dibatalkan"],
  dikerjakan: ["selesai"],
  selesai: [],
  dibatalkan: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: BookingStatus): BookingStatus[] {
  return TRANSITIONS[from];
}


export type Summary = {
  total: number;
  today: number;
  byStatus: Record<BookingStatus, number>;
};

export function getSummary(bookings: Booking[], today: string): Summary {
  const byStatus: Record<BookingStatus, number> = {
    terjadwal: 0,
    dikerjakan: 0,
    selesai: 0,
    dibatalkan: 0,
  };
  for (const b of bookings) byStatus[b.status] += 1;
  return {
    total: bookings.length,
    today: bookings.filter((b) => b.date === today && b.status !== "dibatalkan").length,
    byStatus,
  };
}

let cache: Booking[] = [];

export async function fetchBookings(): Promise<Booking[]> {
  await delay(500);
  // shortcut: ?failLoad=1 memicu error untuk uji T9, hapus jika tak perlu
  if (new URLSearchParams(location.search).get("failLoad") === "1") {
    throw new Error("Gagal memuat data (simulasi).");
  }
  cache = loadBookings();
  return [...cache];
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  await delay();
  const err = validateInput(input);
  if (err) throw new Error(err);
  if (hasConflict(cache, input.date, input.time)) {
    throw new Error(`Slot ${input.date} ${input.time} sudah terisi.`);
  }
  const booking: Booking = {
    ...input,
    id: uid(),
    status: "terjadwal",
    createdAt: new Date().toISOString(),
  };
  cache = [...cache, booking];
  saveBookings(cache);
  return booking;
}

export async function updateBooking(id: string, patch: Partial<BookingInput>): Promise<Booking> {
  await delay();
  const idx = cache.findIndex((b) => b.id === id);
  if (idx < 0) throw new Error("Booking tidak ditemukan.");
  const merged: Booking = { ...cache[idx], ...patch, vehicle: { ...cache[idx].vehicle, ...patch.vehicle } };
  const err = validateInput(merged);
  if (err) throw new Error(err);
  if (hasConflict(cache, merged.date, merged.time, id)) {
    throw new Error(`Slot ${merged.date} ${merged.time} sudah terisi.`);
  }
  cache = cache.map((b) => (b.id === id ? merged : b));
  saveBookings(cache);
  return merged;
}

export async function setStatus(id: string, to: BookingStatus): Promise<Booking> {
  await delay(300);
  const b = cache.find((x) => x.id === id);
  if (!b) throw new Error("Booking tidak ditemukan.");
  if (!canTransition(b.status, to)) throw new Error(`Transisi ${b.status} → ${to} tidak valid.`);
  cache = cache.map((x) => (x.id === id ? { ...x, status: to } : x));
  saveBookings(cache);
  return cache.find((x) => x.id === id)!;
}

export async function removeBooking(id: string): Promise<void> {
  await delay(300);
  cache = cache.filter((b) => b.id !== id);
  saveBookings(cache);
}
