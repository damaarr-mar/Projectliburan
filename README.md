# Workshop Booking Schedule

Aplikasi web untuk mencatat dan mengelola jadwal servis bengkel (data simulasi).  
Project Lab TypeScript — **Damar FAtihatul-Nomor Absen 10**.

## Ringkasan
Aplikasi ini membantu admin/kasir mencatat booking servis tanpa bentrok slot. Slot dihitung dari kombinasi **tanggal + jam mulai**. Sistem menolak booking baru atau hasil edit yang memakai slot aktif yang sama.

## Stack
- **Vite** + **Vanilla TypeScript** + **HTML** + **CSS**
- Persistensi data: `localStorage`
- Tanpa framework, backend, atau database online

## Cara Menjalankan
Prasyarat: Node.js dan npm.

```bash
npm install
npm run dev
```

Build produksi:
```bash
npm run build
npm run preview
```

## Fitur
### Fitur inti
- **CRUD booking**: tambah, lihat, ubah, hapus booking.
- **Status booking**: `terjadwal → dikerjakan → selesai`, serta `terjadwal → dibatalkan` (transisi tidak valid ditolak).
- **Pencarian & filter/sort**: cari nama/kendaraan/layanan, filter status/tanggal, urutkan waktu naik/turun.
- **Ringkasan otomatis**: total booking, booking hari ini, dan jumlah per status.
- **Persistensi**: data tersimpan di `localStorage` dan tetap ada setelah refresh.
- **Validasi & UI state**: field wajib, tanggal tidak boleh masa lalu, jam operasional 08:00–16:00, tampilan loading/kosong/error, pesan konflik jelas.
- **Async simulasi**: muat/simpan data melalui `async/await` dengan jeda simulasi dan indikator loading.

### Fitur khas (Absen 10)
- **Cegah bentrok slot**: booking pada tanggal + jam yang sama dengan booking aktif ditolak.
- **Fungsi `hasConflict(...)`**: fungsi murni bertipe untuk pengecekan konflik slot.
- **Pengecualian logis**: booking `dibatalkan`/`selesai` tidak mengunci slot; saat edit, booking yang sama tidak dianggap bentrok dengan dirinya.
- **Async simulasi**: pengecekan/penyimpanan berjalan lewat fungsi async dengan jeda simulasi.

## Aturan Bisnis
- Slot = `YYYY-MM-DD` + `HH:mm` (durasi dianggap 1 jam, logika sederhana).
- Jam operasional: **08:00–16:00**.
- Tanggal booking tidak boleh di masa lalu.
- Slot aktif yang mengunci jadwal: `terjadwal`, `dikerjakan`.
- Slot kosong untuk booking baru: `dibatalkan`, `selesai`.
- Gunakan **data samaran** (bukan data pribadi asli).

## Struktur Folder
```text
src/
  types/
    booking.ts            # interface, type alias, union/literal type
  services/
    bookingService.ts     # CRUD, hasConflict, transisi status, ringkasan, async
  utils/
    storage.ts            # baca/tulis localStorage
    date.ts               # format & validasi tanggal/jam
  main.ts                 # penghubung UI dan service
  style.css               # styling responsif (tema abu-abu/putih)
index.html
public/
  favicon.svg             # ikon kunci pas (workshop)
README.md
```

## Konsep TypeScript
- `interface` / type alias: `Booking`, `Vehicle`, `BookingInput`.
- Union/literal type: `BookingStatus`, `ServiceType`.
- Function bertipe: parameter dan return type eksplisit, termasuk `hasConflict(...)`.
- Array/object bertipe di service dan UI.
- Modul `import/export` antar `types`, `utils`, `services`, dan `main`.
- `async/await` + `Promise` untuk simulasi muat/simpan.
- Utility type: `Omit`, `Partial`, `Record<BookingStatus, number>`.
- Type narrowing untuk nilai nullable/`unknown` (mis. `instanceof Error`, pengecekan `null`).

## Alur Data
```text
Form input
  → validasi (utils/date + bookingService)
  → cek konflik (hasConflict)
  → simpan/muat (storage/localStorage, async simulasi)
  → render UI
  → ringkasan dihitung dari array data
```

## Rencana Pengujian
| No | Skenario | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| T1 | Tambah booking valid | Isi semua field, klik Simpan | Booking muncul di daftar dan ringkasan bertambah |
| T2 | Bentrok slot | Tambah booking di tanggal + jam yang sama dengan booking aktif | Ditolak dengan pesan slot sudah terisi |
| T3 | Slot dari booking dibatalkan | Batalkan booking, lalu buat booking baru di slot yang sama | Booking baru diterima |
| T4 | Input kosong/tidak valid | Kosongkan nama atau pilih tanggal masa lalu | Muncul pesan validasi, data tidak tersimpan |
| T5 | Persistensi | Tambah data, refresh halaman | Data tetap ada |
| T6 | Edit tanpa bentrok diri sendiri | Ubah catatan booking tanpa mengganti slot | Berhasil disimpan |
| T7 | Pencarian & filter | Cari nama, filter status/tanggal, ubah urutan | Daftar sesuai kriteria |
| T8 | Data kosong | Hapus semua booking atau filter tanpa hasil | Tampil pesan data kosong/sesuai |
| T9 | Gagal async | Buka aplikasi dengan `?failLoad=1` | Tampil pesan error dan tombol **Coba lagi** |

## Screenshot
Tambahkan minimal **3 screenshot** fitur penting, misalnya:
1. Form tambah booking + daftar booking.
2. Pesan bentrok slot (T2).
3. Ringkasan, pencarian/filter, atau tampilan responsif.

Simpan screenshot di folder dokumentasi (mis. `docs/screenshots/`) lalu tautkan di sini.

## Deklarasi Penggunaan AI
> Isi bagian ini dengan jujur sesuai penggunaanmu.

- **Alat AI yang digunakan:** _(contoh: ChatGPT/Copilot/Gemini/OpenCode, atau “Tidak menggunakan AI”)_
- **Bagian yang dibantu AI:** _(contoh: struktur awal, penulisan fungsi tertentu, perapian CSS/dokumentasi)_
- **Bagian yang dipahami, diperiksa, dan/atau dimodifikasi sendiri:** _(contoh: logika `hasConflict`, transisi status, validasi, alur async, pengujian, penyesuaian UI)_

## Catatan Demo
- Siapkan data contoh samaran sebelum demo.
- Tunjukkan: tambah booking, uji bentrok, cari/filter/sort, ubah status/batalkan, refresh (persistensi), dan `?failLoad=1` untuk state error.
- Siap jelaskan: model data (`Booking`, `BookingStatus`), fungsi `hasConflict`, dan alur data async.
