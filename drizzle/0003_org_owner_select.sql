-- Pemilik organisasi harus bisa melihat organisasinya sendiri.
--
-- Policy lama hanya mengizinkan baca lewat keanggotaan (`user_org_ids()`).
-- Itu memutus pembuatan organisasi: `INSERT ... RETURNING id` menjalankan
-- policy SELECT pada baris yang dikembalikan, sedangkan baris `org_members`
-- baru bisa dibuat SETELAH id organisasinya diketahui. Akibatnya insert selalu
-- gagal dengan 42501 — padahal WITH CHECK-nya lolos.
--
-- Menambahkan `owner_id = auth.uid()` memperbaiki itu sekaligus menutup celah
-- lain: kalau baris keanggotaan pemilik terhapus, organisasinya tidak jadi
-- tak terlihat oleh pemiliknya sendiri.

DROP POLICY IF EXISTS organizations_select ON organizations;

CREATE POLICY organizations_select ON organizations FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT public.user_org_ids())
  );
