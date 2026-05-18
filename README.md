# MoyUNNES

> **To-do list jadwal kuliahmu agar rapi dan tidak lupa.**
> Dibuat untuk mahasiswa Universitas Negeri Semarang.

MoyUNNES adalah aplikasi web ringan tanpa server yang menggabungkan **jadwal kuliah** dan **to-do list** dalam satu papan interaktif bergaya Kanban — dengan drag-and-drop yang mulus, notifikasi pengingat, dan tema gelap/terang.

---

## Fitur Utama

- **Konfigurasi hari fleksibel** — tambah/edit/hapus hari sesuai kebutuhan (Senin–Minggu, atau hanya Senin–Jumat, terserah kamu).
- **Mata kuliah lengkap** — nama, dosen, jam, ruang, warna aksen, catatan.
- **To-do list per mata kuliah** — judul, detail, prioritas (rendah/normal/tinggi), tenggat waktu, status selesai.
- **Drag & drop yang mulus**:
  - Reorder mata kuliah dalam satu hari.
  - Pindahkan mata kuliah antar hari.
  - Reorder atau pindahkan tugas antar mata kuliah.
- **Notifikasi pintar**:
  - Toast in-app untuk setiap aksi.
  - Notifikasi browser saat 1 jam / 10 menit menjelang tenggat.
  - Pengingat 15 menit sebelum kelas dimulai.
- **Pencarian & filter** — cari mata kuliah/tugas, atau filter "Hari ini".
- **Tema terang & gelap** — beralih instan.
- **Logo UNNES** kustom (SVG) dengan palet hijau-emas khas universitas.
- **Export / Import JSON** — backup atau pindahkan datamu.
- **Penyimpanan lokal** — semua data tersimpan di browser; tidak butuh akun.
- **Responsif** — bekerja baik di desktop maupun mobile.

---

## Cara Pakai

1. Buka `index.html` di browser modern (Chrome, Edge, Firefox, Safari).
2. Sidebar kiri menampilkan daftar hari. Tombol **+ Tambah** untuk menambah hari baru.
3. Tombol **Tambah Mata Kuliah** di header papan untuk menambah mata kuliah.
4. Klik tombol kecil **+ Tambah tugas** di setiap kartu mata kuliah untuk menambah tugas.
5. **Tarik** kartu mata kuliah atau item tugas untuk mengubah urutan / memindahkannya.
6. Klik tombol **Notifikasi** di header sekali untuk memberi izin pengingat browser.

---

## Struktur Proyek

```
moyunice/
  index.html
  styles/
    style.css
  scripts/
    storage.js        # localStorage + import/export JSON
    notifications.js  # toast + Web Notification API + reminder logic
    dragdrop.js       # drag-and-drop dengan placeholder yang halus
    app.js            # controller utama (render, CRUD, events)
  assets/
    unnes-logo.svg    # logo MoyUNNES bergaya UNNES
    favicon.svg
```

Tidak ada build tool, tidak ada framework — murni HTML + CSS + JavaScript. Cukup buka `index.html`.

---

## Catatan Logo

Logo `assets/unnes-logo.svg` adalah ilustrasi orisinal yang terinspirasi semangat UNNES (perisai + obor pendidikan + buku). Untuk publikasi resmi, ganti dengan logo UNNES resmi sesuai panduan brand kampus.
