-- =====================================================
-- SQL Script: Reset & Seed Data Baru
-- Jalankan di Supabase Dashboard -> SQL Editor
-- =====================================================
-- PERINGATAN: Script ini akan MENGHAPUS semua data lama!
-- =====================================================

-- ====================
-- BAGIAN 1: HAPUS DATA LAMA
-- ====================

-- Hapus activity logs terlebih dahulu (foreign key constraint)
TRUNCATE TABLE public.activity_logs CASCADE;

-- Hapus borrowing requests
TRUNCATE TABLE public.borrowing_requests CASCADE;

-- Hapus user roles
TRUNCATE TABLE public.user_roles CASCADE;

-- Hapus profiles (akan menghapus dari auth.users juga melalui trigger)
DELETE FROM public.profiles;

-- Hapus items
TRUNCATE TABLE public.items CASCADE;

-- ====================
-- BAGIAN 2: SEED ITEMS (Kunci & Infokus)
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
  -- Infokus
  ('Infokus Epson 01', 'infokus', 'Lab TKJ 1', 'tersedia', 'Resolusi 1080p'),
  ('Infokus Epson 02', 'infokus', 'Lab TI 1', 'tersedia', 'Resolusi 1080p'),
  ('Infokus BenQ 01', 'infokus', 'Lab Multimedia 1', 'tersedia', 'Resolusi 4K'),
  ('Infokus BenQ 02', 'infokus', 'Aula Sekolah', 'tersedia', 'Resolusi 4K'),
  ('Infokus Portable 01', 'infokus', 'Mobile', 'tersedia', 'Portable, layar kecil'),
  ('Infokus Portable 02', 'infokus', 'Mobile', 'tersedia', 'Portable, layar kecil');

-- ====================
-- BAGIAN 3: BUAT AKUN USER BARU
-- ====================

-- ⚠️ PENTING: Untuk membuat user baru di Supabase, 
-- Anda perlu menggunakan Supabase Dashboard atau sign up melalui aplikasi.
-- Berikut adalah instruksi untuk membuat akun secara manual:

-- OPSI A: Via Supabase Dashboard -> Authentication -> Users -> Add User

-- OPSI B: Via SQL dengan auth.users 
-- (Catatan: Password harus di-hash, ini contoh dengan password "password123")

-- Fungsi helper untuk membuat user (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_test_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_jurusan text DEFAULT NULL,
  p_angkatan integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users using Supabase's internal function
  new_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', p_full_name),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Profile will be created automatically by trigger
  -- But we need to update it with additional info
  UPDATE public.profiles 
  SET 
    full_name = p_full_name,
    jurusan = p_jurusan::jurusan,
    angkatan = p_angkatan
  WHERE id = new_user_id;
  
  -- Assign role (trigger assigns 'siswa' by default, so update if different)
  IF p_role != 'siswa' THEN
    UPDATE public.user_roles 
    SET role = p_role::app_role 
    WHERE user_id = new_user_id;
  END IF;
  
  RETURN new_user_id;
END;
$$;

-- ====================
-- BUAT 1 ADMIN
-- ====================
SELECT public.create_test_user(
  'admin@sekolah.ac.id',
  'password123',
  'Administrator Sistem',
  'admin',
  NULL,
  NULL
);

-- ====================
-- BUAT 5 GURU
-- ====================
SELECT public.create_test_user('guru1@sekolah.ac.id', 'password123', 'Pak Ahmad Santoso', 'guru', NULL, NULL);
SELECT public.create_test_user('guru2@sekolah.ac.id', 'password123', 'Bu Siti Rahayu', 'guru', NULL, NULL);
SELECT public.create_test_user('guru3@sekolah.ac.id', 'password123', 'Pak Budi Prasetyo', 'guru', NULL, NULL);
SELECT public.create_test_user('guru4@sekolah.ac.id', 'password123', 'Bu Dewi Lestari', 'guru', NULL, NULL);
SELECT public.create_test_user('guru5@sekolah.ac.id', 'password123', 'Pak Hendro Wijaya', 'guru', NULL, NULL);

-- ====================
-- BUAT 15 SISWA
-- ====================
-- Jurusan: trkj, ti, trmm
-- Angkatan: 2024, 2023, 2022

-- TRKJ (5 siswa)
SELECT public.create_test_user('siswa1@sekolah.ac.id', 'password123', 'Andi Pratama', 'siswa', 'trkj', 2024);
SELECT public.create_test_user('siswa2@sekolah.ac.id', 'password123', 'Budi Santoso', 'siswa', 'trkj', 2024);
SELECT public.create_test_user('siswa3@sekolah.ac.id', 'password123', 'Citra Dewi', 'siswa', 'trkj', 2023);
SELECT public.create_test_user('siswa4@sekolah.ac.id', 'password123', 'Dian Permata', 'siswa', 'trkj', 2023);
SELECT public.create_test_user('siswa5@sekolah.ac.id', 'password123', 'Eko Saputra', 'siswa', 'trkj', 2022);

-- TI (5 siswa)
SELECT public.create_test_user('siswa6@sekolah.ac.id', 'password123', 'Fani Wijaya', 'siswa', 'ti', 2024);
SELECT public.create_test_user('siswa7@sekolah.ac.id', 'password123', 'Gunawan Putra', 'siswa', 'ti', 2024);
SELECT public.create_test_user('siswa8@sekolah.ac.id', 'password123', 'Hana Safitri', 'siswa', 'ti', 2023);
SELECT public.create_test_user('siswa9@sekolah.ac.id', 'password123', 'Ivan Kurniawan', 'siswa', 'ti', 2023);
SELECT public.create_test_user('siswa10@sekolah.ac.id', 'password123', 'Julia Andriani', 'siswa', 'ti', 2022);

-- TRMM (5 siswa)
SELECT public.create_test_user('siswa11@sekolah.ac.id', 'password123', 'Kevin Hidayat', 'siswa', 'trmm', 2024);
SELECT public.create_test_user('siswa12@sekolah.ac.id', 'password123', 'Lisa Permatasari', 'siswa', 'trmm', 2024);
SELECT public.create_test_user('siswa13@sekolah.ac.id', 'password123', 'Muhammad Rizki', 'siswa', 'trmm', 2023);
SELECT public.create_test_user('siswa14@sekolah.ac.id', 'password123', 'Nina Anggraini', 'siswa', 'trmm', 2023);
SELECT public.create_test_user('siswa15@sekolah.ac.id', 'password123', 'Oscar Pratama', 'siswa', 'trmm', 2022);

-- ====================
-- VERIFIKASI DATA
-- ====================

-- Cek jumlah user per role
SELECT 
  ur.role, 
  COUNT(*) as jumlah
FROM public.user_roles ur
GROUP BY ur.role
ORDER BY ur.role;

-- Cek jumlah items
SELECT type, COUNT(*) as jumlah FROM public.items GROUP BY type;

-- Lihat semua akun
SELECT 
  p.email,
  p.full_name,
  ur.role,
  p.jurusan,
  p.angkatan
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY ur.role, p.full_name;

-- ====================
-- CLEANUP: Hapus fungsi helper setelah selesai
-- ====================
-- DROP FUNCTION IF EXISTS public.create_test_user;
