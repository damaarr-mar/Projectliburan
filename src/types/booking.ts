export type BookingStatus = "terjadwal" | "dikerjakan" | "selesai" | "dibatalkan";

export type ServiceType = "ganti-oli" | "tune-up" | "rem" | "ban" | "servis-umum";

export interface Vehicle {
  plateNumber: string; // data simulasi, mis. "L 1234 XX"
  type: "motor" | "mobil";
  model: string;
}

export interface Booking {
  id: string;
  customerName: string; // nama samaran
  vehicle: Vehicle;
  service: ServiceType;
  date: string; // format YYYY-MM-DD
  time: string; // format HH:mm
  status: BookingStatus;
  notes?: string; // optional property
  createdAt: string;
}

export type BookingInput = Omit<Booking, "id" | "status" | "createdAt">;
