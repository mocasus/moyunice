<p align="center">
  <img src="assets/unnes-logo.jpg" alt="Logo UNNES" width="100" />
</p>

<h1 align="center">MoyUNNES</h1>

<p align="center">
  <strong>To-do list jadwal kuliahmu agar rapi dan tidak lupa.</strong><br/>
  <sub>Dibuat khusus untuk mahasiswa Universitas Negeri Semarang.</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web-f5b800?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/Framework-Vanilla_JS-7a4b00?style=for-the-badge&logo=javascript&logoColor=white" />
  <img src="https://img.shields.io/badge/Storage-LocalStorage-e0a300?style=for-the-badge&logo=databricks&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-ffcf3d?style=for-the-badge" />
</p>

---

## Tentang

**MoyUNNES** adalah aplikasi web ringan tanpa server yang menggabungkan **jadwal kuliah** dan **to-do list tugas** dalam satu papan interaktif bergaya Kanban. Dirancang agar mahasiswa UNNES bisa mengatur jadwal mingguan dengan mudah — drag, drop, selesai.

- Tidak butuh akun atau login
- Semua data tersimpan di browser (localStorage)
- Bisa diakses offline setelah pertama kali dimuat
- Responsif — desktop & mobile

---

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Hari fleksibel** | Tambah/edit/hapus hari sesukamu (Senin–Minggu, atau cuma 5 hari) |
| **Mata kuliah lengkap** | Nama, dosen, jam mulai-selesai, ruang, warna aksen, catatan |
| **To-do per mata kuliah** | Judul, detail, prioritas (rendah/normal/tinggi), tenggat, checkbox selesai |
| **Drag & drop smooth** | Reorder mata kuliah & tugas, pindah antar hari/mata kuliah dengan animasi halus |
| **Notifikasi pintar** | Toast in-app + notifikasi browser (1 jam & 10 menit sebelum tenggat, 15 menit sebelum kelas) |
| **Pencarian & filter** | Real-time search + filter "Hari ini" / "Aktif" |
| **Tema terang & gelap** | Toggle instan, preferensi tersimpan |
| **Export / Import JSON** | Backup atau migrasi data dengan satu klik |
| **Logo UNNES resmi** | Diambil langsung dari Wikimedia Commons |
| **Statistik progress** | Total mata kuliah, tugas, dan persentase selesai dengan progress bar |

---

## Screenshot

> Buka langsung: **[moyunice.vercel.app](https://moyunice.vercel.app)** (atau URL deploy kamu)

---

## Cara Pakai

```
1. Buka website MoyUNNES di browser modern
2. Sidebar kiri → klik "+ Tambah" untuk menambah hari
3. Header papan → klik "Tambah Mata Kuliah"
4. Di setiap kartu mata kuliah → klik "+ Tambah tugas"
5. Tarik (drag) kartu atau tugas untuk mengubah urutan / pindah hari
6. Klik tombol Notifikasi di header untuk mengaktifkan pengingat browser
7. Gunakan toggle bulan di kanan atas untuk beralih tema gelap/terang
```

---

## Teknologi

| Layer | Tech |
|-------|------|
| Markup | HTML5 semantik |
| Styling | CSS3 (Custom Properties, Grid, Flexbox, Animations) |
| Logic | Vanilla JavaScript (ES6+, modular IIFE) |
| Storage | Web Storage API (localStorage) |
| Notifikasi | Web Notification API + in-app toast |
| Drag & Drop | HTML5 Drag and Drop API + custom placeholder |
| Font | Plus Jakarta Sans + Poppins (Google Fonts) |
| Hosting | Vercel / GitHub Pages / Netlify (static) |

**Zero dependencies. Zero build step.** Cukup buka `index.html`.

---

## Struktur Proyek

```
moyunice/
├── index.html              # Halaman utama + semua modal
├── vercel.json             # Config Vercel (cache headers)
├── .nojekyll               # Bypass Jekyll di GitHub Pages
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # Auto-deploy ke GitHub Pages
├── styles/
│   └── style.css           # Tema kuning dominan + dark mode
├── scripts/
│   ├── storage.js          # localStorage + import/export JSON
│   ├── notifications.js    # Toast + Web Notification + reminder
│   ├── dragdrop.js         # Drag-and-drop dengan placeholder halus
│   └── app.js              # Controller utama (render, CRUD, events)
├── assets/
│   ├── unnes-logo.jpg      # Logo UNNES resmi (dari Wikimedia Commons)
│   └── favicon.svg         # Favicon kuning
└── README.md
```

---

## Deploy Sendiri

### Vercel (Recommended)
1. Fork/clone repo ini
2. Buka [vercel.com](https://vercel.com) → Import Git Repository
3. Pilih repo `moyunice` → Deploy
4. Selesai — auto-deploy setiap push ke `main`

### GitHub Pages
1. Fork repo → Settings → Pages → Source: **GitHub Actions**
2. Workflow otomatis berjalan pada setiap push ke `main`
3. Akses di `https://<username>.github.io/moyunice/`

### Lokal
```bash
git clone https://github.com/mocasus/moyunice.git
cd moyunice
# Buka langsung di browser:
open index.html
# Atau jalankan server sederhana:
python3 -m http.server 8080
```

---

## Kontribusi

Pull request diterima! Beberapa ide pengembangan:

- [ ] Kalender bulanan visual
- [ ] Ekspor jadwal ke PDF
- [ ] Integrasi .ics (Google Calendar)
- [ ] PWA (installable, offline-first)
- [ ] Statistik per mata kuliah
- [ ] Tema warna kustom per user

---

## Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.

---

<p align="center">
  <sub>Dibuat dengan semangat untuk mahasiswa <strong>Universitas Negeri Semarang</strong></sub><br/>
  <img src="https://img.shields.io/badge/UNNES-Semarang-f5b800?style=flat-square" />
</p>
