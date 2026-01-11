-- =====================================================
-- SQL Script untuk mengizinkan update role saat pendaftaran
-- =====================================================
-- Script ini menambahkan policy yang memungkinkan user baru
-- untuk mengupdate role mereka sendiri saat pendaftaran.
-- 
-- PENTING: Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- Opsi 1: Menggunakan SECURITY DEFINER function (Lebih Aman)
-- Function ini bypass RLS dan hanya bisa dipanggil untuk update role sendiri

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role public.app_role
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pastikan user hanya bisa update role sendiri
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: tidak bisa mengubah role user lain';
  END IF;

  -- Update role user
  UPDATE public.user_roles 
  SET role = p_role 
  WHERE user_id = p_user_id;

  -- Jika tidak ada row yang diupdate, insert new
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO UPDATE SET role = p_role;
  END IF;

  RETURN TRUE;
END;
$$;

-- Grant permission untuk authenticated users
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, public.app_role) TO authenticated;

-- =====================================================
-- Opsi 2: Tambahkan RLS Policy untuk self-update (Alternatif)
-- Uncomment jika ingin menggunakan pendekatan RLS langsung
-- =====================================================

-- DROP POLICY IF EXISTS "Users can update own role" ON public.user_roles;
-- 
-- CREATE POLICY "Users can update own role"
--   ON public.user_roles FOR UPDATE
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Verifikasi: Cek policy yang ada
-- =====================================================
-- SELECT * FROM pg_policies WHERE tablename = 'user_roles';
