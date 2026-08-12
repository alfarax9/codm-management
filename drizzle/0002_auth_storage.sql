-- Sinkronisasi identitas Supabase ke tabel aplikasi, dan bucket penyimpanan file.

-- ---------------------------------------------------------------------------
-- auth.users → profiles
--
-- Setiap user Supabase harus punya baris `profiles`, karena seluruh foreign key
-- aplikasi menunjuk ke sana, bukan ke auth.users. Trigger ini menjamin barisnya
-- ada sejak detik pendaftaran — tanpa itu, request pertama seorang user baru
-- akan gagal dengan pelanggaran foreign key.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Email yang diubah lewat Supabase Auth ikut tersalin.
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_changed ON auth.users;
CREATE TRIGGER on_auth_user_email_changed
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Bucket penyimpanan
--
-- `map-images` publik supaya bisa dipakai <Image> Next.js tanpa signed URL —
-- isinya gambar map game, bukan data sensitif.
-- `scoreboards` dan `rulesets` privat: screenshot dan dokumen aturan hanya
-- boleh dilihat anggota organisasi.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('map-images',  'map-images',  true,  5242880,  ARRAY['image/png','image/jpeg','image/webp']),
  ('scoreboards', 'scoreboards', false, 10485760, ARRAY['image/png','image/jpeg','image/webp']),
  ('rulesets',    'rulesets',    false, 20971520, ARRAY['image/png','image/jpeg','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Semua orang boleh melihat gambar map; hanya pengelola org yang boleh mengunggah.
CREATE POLICY map_images_read ON storage.objects FOR SELECT
  USING (bucket_id = 'map-images');
CREATE POLICY map_images_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'map-images' AND EXISTS (SELECT 1 FROM public.user_org_ids()));
CREATE POLICY map_images_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'map-images' AND EXISTS (SELECT 1 FROM public.user_org_ids()));

-- Bucket privat memakai konvensi path `<org_id>/<berkas>`, sehingga akses bisa
-- diperiksa dari segmen pertama nama objek.
CREATE POLICY scoreboards_access ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'scoreboards'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'scoreboards'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY rulesets_access ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'rulesets'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'rulesets'
    AND public.is_org_member((storage.foldername(name))[1]::uuid)
  );
