-- =====================================================
-- SQL Script Alternatif: Reset Data & Panduan Manual
-- Jalankan di Supabase Dashboard -> SQL Editor
-- =====================================================
-- Gunakan script ini jika script utama gagal
-- =====================================================

-- ====================
-- STEP 1: HAPUS DATA LAMA (Jalankan ini dulu)
-- ====================

-- Hapus semua activity logs
DELETE FROM public.activity_logs;

-- Hapus semua borrowing requests
DELETE FROM public.borrowing_requests;

-- Hapus semua user roles
DELETE FROM public.user_roles;

-- Hapus semua profiles 
DELETE FROM public.profiles;

-- Hapus semua items
DELETE FROM public.items;

-- Hapus semua users dari auth (HATI-HATI!)
-- Jalankan ini hanya jika Anda ingin reset total
DELETE FROM auth.users;

SELECT 'Data lama berhasil dihapus!' as status;

-- ====================
-- STEP 2: SEED ITEMS (Copy-paste dan jalankan)
-- ====================

INSERT INTO public.items (name, type, room_name, status, condition_notes) VALUES
  -- Kunci Ruangan (10 kunci)
  ('Kunci Ruang Telematika', 'kunci', 'Ruang 101', 'tersedia', 'Kondisi baik'),
  ('Kunci Sistem Komputer', 'kunci', 'Ruang 102', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Proses Informasi', 'kunci', 'Ruang 103', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Rekayasa Perangkat Lunak', 'kunci', 'Ruang 104', 'tersedia', 'Kondisi baik'),
  ('Kunci Big Data', 'kunci', 'Ruang 105', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Proses Otomasi Robot', 'kunci', 'Ruang 106', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Jaringan Komputer', 'kunci', 'Ruang 107', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Infrastruktur Jaringan', 'kunci', 'Ruang 108', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Keamanan Jaringan', 'kunci', 'Ruang 109', 'tersedia', 'Kondisi baik'),
  ('Kunci Lab Komputasi Awan', 'kunci', 'Ruang 110', 'tersedia', 'Kondisi baik'),
  -- Infokus (6 infokus)
  ('Infokus Epson 01', 'infokus', 'Lab TKJ 1', 'tersedia', 'Resolusi 1080p'),
  ('Infokus Epson 02', 'infokus', 'Lab TI 1', 'tersedia', 'Resolusi 1080p'),
  ('Infokus BenQ 01', 'infokus', 'Lab Multimedia 1', 'tersedia', 'Resolusi 4K'),
  ('Infokus BenQ 02', 'infokus', 'Aula Sekolah', 'tersedia', 'Resolusi 4K'),
  ('Infokus Portable 01', 'infokus', 'Mobile', 'tersedia', 'Portable'),
  ('Infokus Portable 02', 'infokus', 'Mobile', 'tersedia', 'Portable');

SELECT 'Items berhasil ditambahkan!' as status, COUNT(*) as total FROM public.items;

-- ====================
-- STEP 3: BUAT AKUN VIA SUPABASE DASHBOARD
-- ====================
-- 
-- Buka: Supabase Dashboard -> Authentication -> Users -> Invite User
-- 
-- Buat akun-akun berikut secara MANUAL:
-- 
-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  DAFTAR AKUN YANG HARUS DIBUAT                                   ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  ADMIN (1 akun)                                                  ║
-- ║  • admin@sekolah.ac.id - Administrator Sistem                    ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  GURU (5 akun)                                                   ║
-- ║  • guru1@sekolah.ac.id - Pak Ahmad Santoso                       ║
-- ║  • guru2@sekolah.ac.id - Bu Siti Rahayu                          ║
-- ║  • guru3@sekolah.ac.id - Pak Budi Prasetyo                       ║
-- ║  • guru4@sekolah.ac.id - Bu Dewi Lestari                         ║
-- ║  • guru5@sekolah.ac.id - Pak Hendro Wijaya                       ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  SISWA (15 akun)                                                 ║
-- ║  • siswa1@sekolah.ac.id  - Andi Pratama (TRKJ, 2024)             ║
-- ║  • siswa2@sekolah.ac.id  - Budi Santoso (TRKJ, 2024)             ║
-- ║  • siswa3@sekolah.ac.id  - Citra Dewi (TRKJ, 2023)               ║
-- ║  • siswa4@sekolah.ac.id  - Dian Permata (TRKJ, 2023)             ║
-- ║  • siswa5@sekolah.ac.id  - Eko Saputra (TRKJ, 2022)              ║
-- ║  • siswa6@sekolah.ac.id  - Fani Wijaya (TI, 2024)                ║
-- ║  • siswa7@sekolah.ac.id  - Gunawan Putra (TI, 2024)              ║
-- ║  • siswa8@sekolah.ac.id  - Hana Safitri (TI, 2023)               ║
-- ║  • siswa9@sekolah.ac.id  - Ivan Kurniawan (TI, 2023)             ║
-- ║  • siswa10@sekolah.ac.id - Julia Andriani (TI, 2022)             ║
-- ║  • siswa11@sekolah.ac.id - Kevin Hidayat (TRMM, 2024)            ║
-- ║  • siswa12@sekolah.ac.id - Lisa Permatasari (TRMM, 2024)         ║
-- ║  • siswa13@sekolah.ac.id - Muhammad Rizki (TRMM, 2023)           ║
-- ║  • siswa14@sekolah.ac.id - Nina Anggraini (TRMM, 2023)           ║
-- ║  • siswa15@sekolah.ac.id - Oscar Pratama (TRMM, 2022)            ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- 
-- Password untuk semua: password123

-- ====================
-- STEP 4: SETELAH USER DIBUAT, UPDATE ROLES
-- ====================
-- Jalankan script di bawah ini SETELAH user dibuat via Dashboard

-- Update role untuk Admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'admin@sekolah.ac.id');

-- Update role untuk Guru (5 guru)
UPDATE public.user_roles 
SET role = 'guru'
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email IN (
    'guru1@sekolah.ac.id',
    'guru2@sekolah.ac.id',
    'guru3@sekolah.ac.id',
    'guru4@sekolah.ac.id',
    'guru5@sekolah.ac.id'
  )
);

-- Siswa sudah otomatis role 'siswa' dari trigger, jadi tidak perlu update

-- Update jurusan dan angkatan untuk siswa
-- TRKJ
UPDATE public.profiles SET jurusan = 'trkj', angkatan = 2024 WHERE email IN ('siswa1@sekolah.ac.id', 'siswa2@sekolah.ac.id');
UPDATE public.profiles SET jurusan = 'trkj', angkatan = 2023 WHERE email IN ('siswa3@sekolah.ac.id', 'siswa4@sekolah.ac.id');
UPDATE public.profiles SET jurusan = 'trkj', angkatan = 2022 WHERE email = 'siswa5@sekolah.ac.id';

-- TI
UPDATE public.profiles SET jurusan = 'ti', angkatan = 2024 WHERE email IN ('siswa6@sekolah.ac.id', 'siswa7@sekolah.ac.id');
UPDATE public.profiles SET jurusan = 'ti', angkatan = 2023 WHERE email IN ('siswa8@sekolah.ac.id', 'siswa9@sekolah.ac.id');
UPDATE public.profiles SET jurusan = 'ti', angkatan = 2022 WHERE email = 'siswa10@sekolah.ac.id';

-- TRMM
UPDATE public.profiles SET jurusan = 'trmm', angkatan = 2024 WHERE email IN ('siswa11@sekolah.ac.id', 'siswa12@sekolah.ac.id');
UPDATE public.profiles SET jurusan = 'trmm', angkatan = 2023 WHERE email IN ('siswa13@sekolah.ac.id', 'siswa14@sekolah.ac.id');
UPDATE public.profiles SET jurusan = 'trmm', angkatan = 2022 WHERE email = 'siswa15@sekolah.ac.id';

-- ====================
-- STEP 5: VERIFIKASI
-- ====================

-- Cek semua user dan role-nya
SELECT 
  p.email,
  p.full_name,
  ur.role,
  p.jurusan,
  p.angkatan
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY 
  CASE ur.role 
    WHEN 'admin' THEN 1 
    WHEN 'guru' THEN 2 
    WHEN 'siswa' THEN 3 
  END,
  p.full_name;

-- Ringkasan jumlah user per role
SELECT 
  ur.role, 
  COUNT(*) as jumlah
FROM public.user_roles ur
GROUP BY ur.role;

-- Cek items
SELECT type, COUNT(*) as jumlah FROM public.items GROUP BY type;
