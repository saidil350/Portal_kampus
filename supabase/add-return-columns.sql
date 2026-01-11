-- =====================================================
-- SQL Script untuk Menambah Kolom Pengembalian
-- Jalankan di Supabase Dashboard -> SQL Editor
-- =====================================================

-- Tambah kolom return_photo_url ke tabel borrowing_requests
ALTER TABLE public.borrowing_requests
ADD COLUMN IF NOT EXISTS return_photo_url TEXT DEFAULT NULL;

-- Tambah kolom return_condition ke tabel borrowing_requests
ALTER TABLE public.borrowing_requests
ADD COLUMN IF NOT EXISTS return_condition TEXT DEFAULT NULL;

-- Tambah kolom returned_at jika belum ada
ALTER TABLE public.borrowing_requests
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ DEFAULT NULL;

-- Verifikasi kolom sudah ditambahkan
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'borrowing_requests' 
AND column_name IN ('return_photo_url', 'return_condition', 'returned_at');
