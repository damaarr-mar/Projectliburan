import "./style.css";
import type { Booking, BookingInput, BookingStatus, ServiceType } from "./types/booking.ts";
import { operatingHours, todayString } from "./utils/date.ts";
import {
  createBooking,
  fetchBookings,
  getSummary,
  nextStatuses,
  removeBooking,
  setStatus,
  updateBooking,
} from "./services/bookingService.ts";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app not found");

type SortDir = "asc" | "desc";
let bookings: Booking[] = [];
let loading = true;
let loadError: string | null = null;
let banner: { type: "ok" | "error"; text: string } | null = null;
let editingId: string | null = null;
let query = "";
let filterStatus: "" | BookingStatus = "";
let filterDate = "";
let sortDir: SortDir = "asc";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const serviceLabel: Record<ServiceType, string> = {
  "ganti-oli": "Ganti Oli",
  "tune-up": "Tune Up",
  rem: "Rem",
  ban: "Ban",
  "servis-umum": "Servis Umum",
};

function filtered(): Booking[] {
  const q = query.trim().toLowerCase();
  return bookings
    .filter((b) => (filterStatus ? b.status === filterStatus : true))
    .filter((b) => (filterDate ? b.date === filterDate : true))
    .filter((b) => {
      if (!q) return true;
      return [b.customerName, b.vehicle.plateNumber, b.vehicle.model, serviceLabel[b.service]]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .sort((a, b) => {
      const ka = `${a.date} ${a.time}`;
      const kb = `${b.date} ${b.time}`;
      return sortDir === "asc" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });
}

function setBanner(type: "ok" | "error", text: string): void {
  banner = { type, text };
  render();
  window.setTimeout(() => {
    if (banner?.text === text) {
      banner = null;
      render();
    }
  }, 3500);
}

async function load(): Promise<void> {
  loading = true;
  loadError = null;
  render();
  try {
    bookings = await fetchBookings();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Gagal memuat data.";
  } finally {
    loading = false;
    render();
  }
}

function formValue(id: string): string {
  return (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value ?? "";
}

function readForm(): BookingInput {
  return {
    customerName: formValue("f-name").trim(),
    vehicle: {
      plateNumber: formValue("f-plate").trim(),
      type: formValue("f-vtype") as "motor" | "mobil",
      model: formValue("f-model").trim(),
    },
    service: formValue("f-service") as ServiceType,
    date: formValue("f-date"),
    time: formValue("f-time"),
    notes: formValue("f-notes").trim() || undefined,
  };
}

function render(): void {
  const summary = getSummary(bookings, todayString());
  const items = filtered();
  const editing = editingId ? bookings.find((b) => b.id === editingId) : undefined;
  const hours = operatingHours();

  app!.innerHTML = `
    <header class="header">
      <div>
        <h1>Workshop Booking Schedule</h1>
        <p class="muted">Pencatatan jadwal servis bengkel (data simulasi)</p>
      </div>
      <div class="summary" aria-label="Ringkasan">
        <div class="card"><strong>${summary.total}</strong><small>Total booking</small></div>
        <div class="card"><strong>${summary.today}</strong><small>Booking hari ini</small></div>
        <div class="card"><strong>${summary.byStatus.terjadwal}</strong><small>Terjadwal</small></div>
        <div class="card"><strong>${summary.byStatus.dikerjakan}/${summary.byStatus.selesai}</strong><small>Dikerjakan/Selesai</small></div>
      </div>
    </header>

    ${banner ? `<div class="banner ${banner.type}" role="status">${esc(banner.text)}</div>` : ""}

    <div class="layout">
      <section class="card" aria-labelledby="form-title">
        <h2 id="form-title">${editing ? "Ubah Booking" : "Tambah Booking"}</h2>
        <form id="booking-form" novalidate>
          <label for="f-name">Nama pelanggan</label>
          <input id="f-name" required value="${esc(editing?.customerName ?? "")}" />
          <div class="row">
            <div>
              <label for="f-plate">Plat nomor</label>
              <input id="f-plate" placeholder="L 1234 XX" value="${esc(editing?.vehicle.plateNumber ?? "")}" />
            </div>
            <div>
              <label for="f-vtype">Jenis</label>
              <select id="f-vtype">
                <option value="motor" ${editing?.vehicle.type === "motor" ? "selected" : ""}>Motor</option>
                <option value="mobil" ${editing?.vehicle.type === "mobil" ? "selected" : ""}>Mobil</option>
              </select>
            </div>
          </div>
          <label for="f-model">Model kendaraan</label>
          <input id="f-model" value="${esc(editing?.vehicle.model ?? "")}" />
          <label for="f-service">Layanan</label>
          <select id="f-service">
            ${(Object.keys(serviceLabel) as ServiceType[])
              .map((s) => `<option value="${s}" ${editing?.service === s ? "selected" : ""}>${serviceLabel[s]}</option>`)
              .join("")}
          </select>
          <div class="row">
            <div>
              <label for="f-date">Tanggal</label>
              <input id="f-date" type="date" min="${todayString()}" value="${esc(editing?.date ?? "")}" />
            </div>
            <div>
              <label for="f-time">Jam</label>
              <select id="f-time">
                <option value="">Pilih jam</option>
                ${hours.map((h) => `<option value="${h}" ${editing?.time === h ? "selected" : ""}>${h}</option>`).join("")}
              </select>
            </div>
          </div>
          <label for="f-notes">Catatan (opsional)</label>
          <textarea id="f-notes">${esc(editing?.notes ?? "")}</textarea>
          <div class="actions">
            <button class="primary" type="submit" id="submit-btn">${editing ? "Simpan Perubahan" : "Simpan"}</button>
            ${editing ? `<button type="button" id="cancel-edit">Batal</button>` : ""}
          </div>
        </form>
      </section>

      <section aria-labelledby="list-title">
        <h2 id="list-title">Jadwal Booking</h2>
        <div class="toolbar">
          <input class="search" id="q" placeholder="Cari nama / kendaraan / layanan" value="${esc(query)}" aria-label="Cari" />
          <select id="f-status" aria-label="Filter status">
            <option value="">Semua status</option>
            ${(["terjadwal", "dikerjakan", "selesai", "dibatalkan"] as BookingStatus[])
              .map((s) => `<option value="${s}" ${filterStatus === s ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
          <input id="f-fdate" type="date" value="${esc(filterDate)}" aria-label="Filter tanggal" />
          <select id="f-sort" aria-label="Urutkan">
            <option value="asc" ${sortDir === "asc" ? "selected" : ""}>Waktu naik</option>
            <option value="desc" ${sortDir === "desc" ? "selected" : ""}>Waktu turun</option>
          </select>
        </div>

        ${loading ? `<div class="state loading" role="status">Memuat data...</div>` : ""}
        ${!loading && loadError ? `<div class="state error" role="alert">${esc(loadError)} <button type="button" id="retry">Coba lagi</button></div>` : ""}
        ${!loading && !loadError && items.length === 0 ? `<div class="state">Belum ada booking yang sesuai.</div>` : ""}
        ${!loading && !loadError && items.length > 0 ? `<div class="list">${items.map(renderItem).join("")}</div>` : ""}
      </section>
    </div>
  `;

  bind();
}

function renderItem(b: Booking): string {
  const next = nextStatuses(b.status);
  return `
    <article class="booking" data-id="${b.id}">
      <div class="booking-head">
        <div>
          <h3>${esc(b.customerName)} · ${esc(b.vehicle.plateNumber)}</h3>
          <div class="meta">${esc(b.vehicle.type)} ${esc(b.vehicle.model)} · ${serviceLabel[b.service]}<br>${esc(b.date)} ${esc(b.time)}${b.notes ? ` · ${esc(b.notes)}` : ""}</div>
        </div>
        <span class="badge ${b.status}">${b.status}</span>
      </div>
      <div class="booking-actions">
        <button type="button" data-act="edit">Ubah</button>
        ${next.map((s) => `<button type="button" data-act="status" data-to="${s}">${s === "dibatalkan" ? "Batalkan" : `→ ${s}`}</button>`).join("")}
        <button type="button" class="danger" data-act="delete">Hapus</button>
      </div>
    </article>
  `;
}

function bind(): void {
  document.getElementById("booking-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("submit-btn") as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
    try {
      const input = readForm();
      if (editingId) {
        await updateBooking(editingId, input);
        setBanner("ok", "Booking diperbarui.");
        editingId = null;
      } else {
        await createBooking(input);
        setBanner("ok", "Booking ditambahkan.");
      }
      bookings = await fetchBookings();
      render();
    } catch (err) {
      setBanner("error", err instanceof Error ? err.message : "Gagal menyimpan.");
      if (btn) btn.disabled = false;
    }
  });

  document.getElementById("cancel-edit")?.addEventListener("click", () => {
    editingId = null;
    render();
  });

  document.getElementById("retry")?.addEventListener("click", () => void load());

  const q = document.getElementById("q") as HTMLInputElement | null;
  q?.addEventListener("input", () => {
    query = q.value;
    render();
    const nq = document.getElementById("q") as HTMLInputElement | null;
    nq?.focus();
    nq?.setSelectionRange(nq.value.length, nq.value.length);
  });

  (document.getElementById("f-status") as HTMLSelectElement | null)?.addEventListener("change", (e) => {
    filterStatus = (e.target as HTMLSelectElement).value as "" | BookingStatus;
    render();
  });
  (document.getElementById("f-fdate") as HTMLInputElement | null)?.addEventListener("change", (e) => {
    filterDate = (e.target as HTMLInputElement).value;
    render();
  });
  (document.getElementById("f-sort") as HTMLSelectElement | null)?.addEventListener("change", (e) => {
    sortDir = (e.target as HTMLSelectElement).value as SortDir;
    render();
  });

  document.querySelectorAll<HTMLElement>(".booking").forEach((el) => {
    const id = el.dataset.id ?? "";
    el.querySelector('[data-act="edit"]')?.addEventListener("click", () => {
      editingId = id;
      banner = null;
      render();
      document.getElementById("f-name")?.focus();
    });
    el.querySelectorAll<HTMLButtonElement>('[data-act="status"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await setStatus(id, btn.dataset.to as BookingStatus);
          bookings = await fetchBookings();
          setBanner("ok", "Status diperbarui.");
        } catch (err) {
          setBanner("error", err instanceof Error ? err.message : "Gagal mengubah status.");
        }
      });
    });
    el.querySelector('[data-act="delete"]')?.addEventListener("click", async () => {
      if (!confirm("Hapus booking ini?")) return;
      try {
        await removeBooking(id);
        if (editingId === id) editingId = null;
        bookings = await fetchBookings();
        setBanner("ok", "Booking dihapus.");
      } catch (err) {
        setBanner("error", err instanceof Error ? err.message : "Gagal menghapus.");
      }
    });
  });
}

void load();
