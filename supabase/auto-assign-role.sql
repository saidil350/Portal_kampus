-- Fungsi untuk auto-assign role siswa saat user baru mendaftar
-- Fungsi ini menggunakan SECURITY DEFINER agar bisa bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default role 'siswa' untuk user baru
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'siswa')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS on_profile_created_assign_role ON public.profiles;

-- Create trigger untuk auto-assign role setelah profile dibuat
CREATE TRIGGER on_profile_created_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
