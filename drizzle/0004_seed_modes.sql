-- Mode permainan sebagai data global.
--
-- Sebelumnya `seedOrgReference()` yang meng-insert baris ini saat organisasi
-- dibuat. Itu keliru dua-duanya:
--
--   1. `modes` tidak dimiliki organisasi mana pun — datanya sama untuk semua.
--   2. Tabelnya hanya punya policy SELECT, jadi insert dari aplikasi selalu
--      ditolak 42501 dan pembuatan organisasi ikut gagal.
--
-- `sort_order` menentukan posisi digit pada kode format scrim: digit ke-1 = HP,
-- ke-2 = SND, ke-3 = CTRL. Mengubahnya akan mengubah arti SEMUA kode format
-- yang sudah tersimpan, jadi kolom ini sengaja hanya bisa diubah lewat migrasi.

INSERT INTO modes (code, name, short_name, obj_time_label_key, sort_order, stat_columns)
VALUES
  (
    'hp', 'Hardpoint', 'HP', 'stats.hillTime', 1,
    '[
      {"key":"score","labelKey":"stats.score","format":"number","modeSpecific":false},
      {"key":"kills","labelKey":"stats.kills","format":"number","modeSpecific":false},
      {"key":"deaths","labelKey":"stats.deaths","format":"number","modeSpecific":false},
      {"key":"assists","labelKey":"stats.assists","format":"number","modeSpecific":false},
      {"key":"impact","labelKey":"stats.impact","format":"number","modeSpecific":false},
      {"key":"objTimeSeconds","labelKey":"stats.hillTime","format":"duration","modeSpecific":true}
    ]'::jsonb
  ),
  (
    'snd', 'Search & Destroy', 'SND', NULL, 2,
    '[
      {"key":"score","labelKey":"stats.score","format":"number","modeSpecific":false},
      {"key":"kills","labelKey":"stats.kills","format":"number","modeSpecific":false},
      {"key":"deaths","labelKey":"stats.deaths","format":"number","modeSpecific":false},
      {"key":"assists","labelKey":"stats.assists","format":"number","modeSpecific":false},
      {"key":"impact","labelKey":"stats.impact","format":"number","modeSpecific":false}
    ]'::jsonb
  ),
  (
    'ctrl', 'Control', 'CTRL', 'stats.zoneTime', 3,
    '[
      {"key":"score","labelKey":"stats.score","format":"number","modeSpecific":false},
      {"key":"kills","labelKey":"stats.kills","format":"number","modeSpecific":false},
      {"key":"deaths","labelKey":"stats.deaths","format":"number","modeSpecific":false},
      {"key":"assists","labelKey":"stats.assists","format":"number","modeSpecific":false},
      {"key":"impact","labelKey":"stats.impact","format":"number","modeSpecific":false},
      {"key":"objTimeSeconds","labelKey":"stats.zoneTime","format":"duration","modeSpecific":true}
    ]'::jsonb
  )
ON CONFLICT (code) DO UPDATE SET
  name               = EXCLUDED.name,
  short_name         = EXCLUDED.short_name,
  obj_time_label_key = EXCLUDED.obj_time_label_key,
  sort_order         = EXCLUDED.sort_order,
  stat_columns       = EXCLUDED.stat_columns;
