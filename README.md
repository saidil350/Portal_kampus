# 🏫 Manajemen Inventoris TIK - Portal Kampus

Sistem Manajemen Inventoris TIK (Teknik Informatika dan Komputer) adalah platform berbasis web modern yang dirancang untuk mempermudah proses peminjaman, pelacakan, dan pengelolaan aset laboratorium seperti kunci ruangan, infokus, dan perangkat lainnya.

![Versi](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Fitur Utama

- **Sistem Autentikasi Modern**: Login & Register dengan peran yang berbeda (Admin, Guru, Siswa).
- **Manajemen Peminjaman Real-time**: Pengajuan peminjaman barang dengan status persetujuan yang transparan.
- **Dashboard Statistik**: Visualisasi data inventoris dan aktivitas peminjaman menggunakan grafik interaktif.
- **Inventoris Terpusat**: Pengelolaan data barang (kunci, infokus, dll) berdasarkan ruangan dan kondisi.
- **Kalender Aktivitas**: Penjadwalan penggunaan ruangan dan peralatan secara visual.
- **Ekspor Laporan**: Fitur unduh laporan dalam format **PDF** dan **Excel**.
- **Log Aktivitas**: Pelacakan setiap perubahan dan transaksi untuk audibilitas yang lebih baik.

## 🛠️ Stack Teknologi

Sistem ini dikembangkan menggunakan teknologi terkini:

- **Frontend**: [React.js](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Struktur Folder

```text
src/
├── components/     # Komponen UI yang dapat digunakan kembali
├── contexts/       # Context API untuk autentikasi dan state global
├── hooks/          # Custom react hooks
├── lib/            # Utilitas dan konfigurasi (Supabase, dll)
├── pages/          # Halaman utama aplikasi (Dashboard, Login, dll)
└── types/          # Definisi tipe TypeScript
```

## 🛠️ Persiapan Instalasi

Pastikan Anda sudah menginstal **Node.js** di komputer Anda.

1. **Clone Repository**

   ```bash
   git clone https://github.com/username/manajemen-inventoris-tik.git
   cd manajemen-inventoris-tik
   ```

2. **Instal Dependensi**

   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file `.env` di root direktori dan masukkan kredensial Supabase Anda:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 🗄️ Setup Database (Supabase)

Skrip SQL untuk inisialisasi tabel, kebijakan (RLS), dan data awal tersedia di folder `/supabase`. Anda bisa menjalankan skrip tersebut di SQL Editor Supabase Dashboard:

1. `auto-seed-all-data.sql` - Inisialisasi tabel, fungsi, dan data uji.
2. `storage-bucket-setup.sql` - Persiapan bucket untuk penyimpanan file.

## 👥 Kontributor

- **[Nama Anda]** - _Project Lead / Developer_

## 📜 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
