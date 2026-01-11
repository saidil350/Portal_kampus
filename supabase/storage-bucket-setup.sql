-- =====================================================
-- SQL Script untuk Membuat Bucket dan Policies Storage
-- Jalankan di Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. Buat bucket 'return-proofs' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('return-proofs', 'return-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Izinkan authenticated users untuk upload file
CREATE POLICY "Authenticated users can upload return proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'return-proofs');

-- 3. Policy: Izinkan semua orang melihat/download file (public read)
CREATE POLICY "Anyone can view return proofs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'return-proofs');

-- 4. Policy: Izinkan user menghapus file mereka sendiri (opsional)
CREATE POLICY "Users can delete their own return proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'return-proofs');

-- 5. Policy: Izinkan user mengupdate file mereka sendiri (opsional)
CREATE POLICY "Users can update their own return proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'return-proofs');
