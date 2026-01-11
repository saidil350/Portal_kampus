-- =====================================================
-- SQL Script: AUTO SEED DATA - LANGSUNG JALAN
-- Jalankan SELURUH script ini di Supabase Dashboard -> SQL Editor
-- =====================================================

-- ====================
-- STEP 1: HAPUS DATA LAMA
-- ====================
DO $$
BEGIN
  -- Hapus data terkait terlebih dahulu
  DELETE FROM public.activity_logs;
  DELETE FROM public.borrowing_requests;
  DELETE FROM public.user_roles;
  DELETE FROM public.profiles;
  DELETE FROM public.items;
  
  -- Hapus users dari auth
  DELETE FROM auth.users WHERE email LIKE '%@sekolah.ac.id';
  
  RAISE NOTICE 'Data lama berhasil dihapus!';
END $$;

-- ====================
-- STEP 2: SEED ITEMS
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

-- ====================
-- STEP 3: BUAT SEMUA USER SECARA OTOMATIS
-- ====================

-- Password: password123 (sudah di-hash dengan bcrypt)
-- Hash ini valid untuk "password123"

DO $$
DECLARE
  hashed_password TEXT := '$2a$10$PwV/5C/hh8GqMvkoxW7Qm.ZQGZk1VvhN7OjL7ydqQmZ4CjN5JyIu6';
  admin_id UUID;
  guru1_id UUID;
  guru2_id UUID;
  guru3_id UUID;
  guru4_id UUID;
  guru5_id UUID;
  siswa1_id UUID;
  siswa2_id UUID;
  siswa3_id UUID;
  siswa4_id UUID;
  siswa5_id UUID;
  siswa6_id UUID;
  siswa7_id UUID;
  siswa8_id UUID;
  siswa9_id UUID;
  siswa10_id UUID;
  siswa11_id UUID;
  siswa12_id UUID;
  siswa13_id UUID;
  siswa14_id UUID;
  siswa15_id UUID;
BEGIN
  -- Generate UUIDs
  admin_id := gen_random_uuid();
  guru1_id := gen_random_uuid();
  guru2_id := gen_random_uuid();
  guru3_id := gen_random_uuid();
  guru4_id := gen_random_uuid();
  guru5_id := gen_random_uuid();
  siswa1_id := gen_random_uuid();
  siswa2_id := gen_random_uuid();
  siswa3_id := gen_random_uuid();
  siswa4_id := gen_random_uuid();
  siswa5_id := gen_random_uuid();
  siswa6_id := gen_random_uuid();
  siswa7_id := gen_random_uuid();
  siswa8_id := gen_random_uuid();
  siswa9_id := gen_random_uuid();
  siswa10_id := gen_random_uuid();
  siswa11_id := gen_random_uuid();
  siswa12_id := gen_random_uuid();
  siswa13_id := gen_random_uuid();
  siswa14_id := gen_random_uuid();
  siswa15_id := gen_random_uuid();

  -- ========== INSERT ADMIN ==========
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    admin_id, '00000000-0000-0000-0000-000000000000', 'admin@sekolah.ac.id', 
    hashed_password, NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Administrator Sistem"}'::jsonb,
    'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''
  );

  -- ========== INSERT 5 GURU ==========
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
    (guru1_id, '00000000-0000-0000-0000-000000000000', 'guru1@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Pak Ahmad Santoso"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (guru2_id, '00000000-0000-0000-0000-000000000000', 'guru2@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Bu Siti Rahayu"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (guru3_id, '00000000-0000-0000-0000-000000000000', 'guru3@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Pak Budi Prasetyo"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (guru4_id, '00000000-0000-0000-0000-000000000000', 'guru4@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Bu Dewi Lestari"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (guru5_id, '00000000-0000-0000-0000-000000000000', 'guru5@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Pak Hendro Wijaya"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '');

  -- ========== INSERT 15 SISWA ==========
  INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
    -- TRKJ
    (siswa1_id, '00000000-0000-0000-0000-000000000000', 'siswa1@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Andi Pratama"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa2_id, '00000000-0000-0000-0000-000000000000', 'siswa2@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Budi Santoso"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa3_id, '00000000-0000-0000-0000-000000000000', 'siswa3@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Citra Dewi"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa4_id, '00000000-0000-0000-0000-000000000000', 'siswa4@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Dian Permata"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa5_id, '00000000-0000-0000-0000-000000000000', 'siswa5@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Eko Saputra"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    -- TI
    (siswa6_id, '00000000-0000-0000-0000-000000000000', 'siswa6@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Fani Wijaya"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa7_id, '00000000-0000-0000-0000-000000000000', 'siswa7@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Gunawan Putra"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa8_id, '00000000-0000-0000-0000-000000000000', 'siswa8@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Hana Safitri"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa9_id, '00000000-0000-0000-0000-000000000000', 'siswa9@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Ivan Kurniawan"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa10_id, '00000000-0000-0000-0000-000000000000', 'siswa10@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Julia Andriani"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    -- TRMM
    (siswa11_id, '00000000-0000-0000-0000-000000000000', 'siswa11@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Kevin Hidayat"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa12_id, '00000000-0000-0000-0000-000000000000', 'siswa12@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Lisa Permatasari"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa13_id, '00000000-0000-0000-0000-000000000000', 'siswa13@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Muhammad Rizki"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa14_id, '00000000-0000-0000-0000-000000000000', 'siswa14@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Nina Anggraini"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''),
    (siswa15_id, '00000000-0000-0000-0000-000000000000', 'siswa15@sekolah.ac.id', hashed_password, NOW(), '{"provider": "email", "providers": ["email"]}'::jsonb, '{"full_name": "Oscar Pratama"}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW(), '', '', '', '');

  RAISE NOTICE 'Semua user berhasil dibuat!';
END $$;

-- ====================
-- STEP 4: UPDATE ROLES (Admin & Guru)
-- ====================
-- Trigger otomatis membuat role 'siswa', jadi kita perlu update untuk admin dan guru

UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'admin@sekolah.ac.id');

UPDATE public.user_roles 
SET role = 'guru'
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email LIKE 'guru%@sekolah.ac.id'
);

-- ====================
-- STEP 5: UPDATE JURUSAN & ANGKATAN SISWA
-- ====================

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
-- STEP 6: VERIFIKASI HASIL
-- ====================

-- Tampilkan semua user
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
  p.email;

-- Ringkasan
SELECT '=== RINGKASAN DATA ===' as info;
SELECT 'Total Users: ' || COUNT(*) FROM public.profiles;
SELECT ur.role, COUNT(*) as jumlah FROM public.user_roles ur GROUP BY ur.role ORDER BY role;
SELECT 'Total Items: ' || COUNT(*) FROM public.items;
SELECT type, COUNT(*) as jumlah FROM public.items GROUP BY type;

-- =====================================================
-- DAFTAR AKUN UNTUK LOGIN:
-- =====================================================
-- 
-- ╔════════════════════════════════════════════════════════╗
-- ║  AKUN LOGIN - Password semua: password123              ║
-- ╠════════════════════════════════════════════════════════╣
-- ║  ADMIN:    admin@sekolah.ac.id                         ║
-- ║  GURU 1:   guru1@sekolah.ac.id                         ║
-- ║  GURU 2:   guru2@sekolah.ac.id                         ║
-- ║  GURU 3:   guru3@sekolah.ac.id                         ║
-- ║  GURU 4:   guru4@sekolah.ac.id                         ║
-- ║  GURU 5:   guru5@sekolah.ac.id                         ║
-- ║  SISWA 1:  siswa1@sekolah.ac.id  (TRKJ, 2024)          ║
-- ║  SISWA 2:  siswa2@sekolah.ac.id  (TRKJ, 2024)          ║
-- ║  SISWA 3:  siswa3@sekolah.ac.id  (TRKJ, 2023)          ║
-- ║  SISWA 4:  siswa4@sekolah.ac.id  (TRKJ, 2023)          ║
-- ║  SISWA 5:  siswa5@sekolah.ac.id  (TRKJ, 2022)          ║
-- ║  SISWA 6:  siswa6@sekolah.ac.id  (TI, 2024)            ║
-- ║  SISWA 7:  siswa7@sekolah.ac.id  (TI, 2024)            ║
-- ║  SISWA 8:  siswa8@sekolah.ac.id  (TI, 2023)            ║
-- ║  SISWA 9:  siswa9@sekolah.ac.id  (TI, 2023)            ║
-- ║  SISWA 10: siswa10@sekolah.ac.id (TI, 2022)            ║
-- ║  SISWA 11: siswa11@sekolah.ac.id (TRMM, 2024)          ║
-- ║  SISWA 12: siswa12@sekolah.ac.id (TRMM, 2024)          ║
-- ║  SISWA 13: siswa13@sekolah.ac.id (TRMM, 2023)          ║
-- ║  SISWA 14: siswa14@sekolah.ac.id (TRMM, 2023)          ║
-- ║  SISWA 15: siswa15@sekolah.ac.id (TRMM, 2022)          ║
-- ╚════════════════════════════════════════════════════════╝
