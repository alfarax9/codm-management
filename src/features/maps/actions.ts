'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { withRls } from '@/db/rls'
import { mapModes, maps, scrimGames } from '@/db/schema'
import type { ActionState } from '@/features/auth/actions'
import { requireManageOrg } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

import { parseMapFormData } from './schema'

const BUCKET = 'map-images'

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Mengunggah gambar ke Storage dan mengembalikan URL publiknya.
 * Nama file diberi sufiks acak supaya mengganti gambar map tidak tertahan cache
 * CDN atas nama file yang sama.
 */
async function uploadImage(orgId: string, slug: string, kind: string, file: File) {
  const supabase = await createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const path = `${orgId}/${slug}-${kind}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw new Error(`Gagal mengunggah gambar: ${error.message}`)

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/** Membuat map baru, atau memperbarui kalau `id` terisi. */
export async function saveMap(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireManageOrg()

  const parsed = parseMapFormData(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { id, name, modeIds, image, minimap } = parsed.data
  const slug = slugify(name)

  try {
    // Unggahan dilakukan di luar transaksi: Storage tidak ikut ter-rollback,
    // dan menahan transaksi selama unggahan berlangsung memboroskan koneksi.
    const imageUrl = image ? await uploadImage(ctx.orgId, slug, 'map', image) : undefined
    const minimapUrl = minimap ? await uploadImage(ctx.orgId, slug, 'mini', minimap) : undefined

    await withRls(ctx.userId, async (tx) => {
      let mapId = id

      if (mapId) {
        await tx
          .update(maps)
          .set({
            name,
            slug,
            ...(imageUrl ? { imageUrl } : {}),
            ...(minimapUrl ? { minimapUrl } : {}),
          })
          .where(and(eq(maps.id, mapId), eq(maps.orgId, ctx.orgId)))

        await tx.delete(mapModes).where(eq(mapModes.mapId, mapId))
      } else {
        const [created] = await tx
          .insert(maps)
          .values({
            orgId: ctx.orgId,
            name,
            slug,
            imageUrl: imageUrl ?? null,
            minimapUrl: minimapUrl ?? null,
            isOfficial: false,
            uploadedBy: ctx.userId,
          })
          .returning({ id: maps.id })
        mapId = created.id
      }

      await tx.insert(mapModes).values(modeIds.map((modeId) => ({ mapId: mapId as string, modeId })))
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Gagal menyimpan map.' }
  }

  revalidatePath('/maps')
  return { message: id ? 'Map diperbarui.' : 'Map ditambahkan.' }
}

/**
 * Menghapus map. Ditolak kalau map sudah dipakai di scrim — foreign key
 * `scrim_games.map_id` memakai ON DELETE SET NULL, jadi menghapusnya akan
 * membuat riwayat pertandingan kehilangan nama map tanpa peringatan.
 */
export async function deleteMap(mapId: string): Promise<ActionState> {
  const ctx = await requireManageOrg()

  try {
    await withRls(ctx.userId, async (tx) => {
      const [used] = await tx
        .select({ id: scrimGames.id })
        .from(scrimGames)
        .where(eq(scrimGames.mapId, mapId))
        .limit(1)

      if (used) {
        throw new Error(
          'Map ini sudah dipakai di scrim yang tercatat. Nonaktifkan saja agar riwayatnya tetap utuh.',
        )
      }

      await tx.delete(maps).where(and(eq(maps.id, mapId), eq(maps.orgId, ctx.orgId)))
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Gagal menghapus map.' }
  }

  revalidatePath('/maps')
  return { message: 'Map dihapus.' }
}
