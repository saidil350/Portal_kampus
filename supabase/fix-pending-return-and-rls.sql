-- =====================================================
-- SQL Script untuk Memperbaiki Request Status dan RLS
-- Jalankan di Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. Tambah status 'pending_return' ke enum request_status
-- Catatan: ALTER TYPE ADD VALUE tidak bisa dijalankan dalam transaksi,
-- jadi jalankan statement ini terpisah jika ada error

ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'pending_return';

-- 2. Tambah RLS Policy agar siswa bisa update request mereka sendiri
-- (untuk fitur pengembalian item)

-- Drop policy lama jika ada konflik
DROP POLICY IF EXISTS "Users can update their own requests" ON public.borrowing_requests;

-- Buat policy baru untuk siswa update request sendiri
CREATE POLICY "Users can update their own requests"
  ON public.borrowing_requests FOR UPDATE
  USING (borrower_id = auth.uid())
  WITH CHECK (borrower_id = auth.uid());

-- 3. Verifikasi enum sudah terupdate
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'public.request_status'::regtype;

-- 4. Verifikasi policy sudah ditambahkan
SELECT policyname FROM pg_policies 
WHERE tablename = 'borrowing_requests';
