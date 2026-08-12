import { asc, eq } from 'drizzle-orm'

import { withRls } from '@/db/rls'
import { mapModes, maps, modes } from '@/db/schema'
import type { OrgContext } from '@/lib/auth/session'

export type MapListItem = {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  minimapUrl: string | null
  isOfficial: boolean
  modes: { id: string; code: string; shortName: string }[]
}

/**
 * Daftar map beserta mode tempat map itu dimainkan.
 *
 * Diambil dengan satu query lalu dikelompokkan di memori. Jumlah map per
 * organisasi ada di orde puluhan, jadi query terpisah per map hanya menambah
 * round-trip tanpa manfaat.
 */
export async function listMaps(ctx: OrgContext): Promise<MapListItem[]> {
  const rows = await withRls(ctx.userId, (tx) =>
    tx
      .select({
        id: maps.id,
        name: maps.name,
        slug: maps.slug,
        imageUrl: maps.imageUrl,
        minimapUrl: maps.minimapUrl,
        isOfficial: maps.isOfficial,
        modeId: modes.id,
        modeCode: modes.code,
        modeShortName: modes.shortName,
      })
      .from(maps)
      .leftJoin(mapModes, eq(mapModes.mapId, maps.id))
      .leftJoin(modes, eq(modes.id, mapModes.modeId))
      .where(eq(maps.orgId, ctx.orgId))
      .orderBy(asc(maps.name), asc(modes.sortOrder)),
  )

  const byId = new Map<string, MapListItem>()
  for (const row of rows) {
    let item = byId.get(row.id)
    if (!item) {
      item = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        imageUrl: row.imageUrl,
        minimapUrl: row.minimapUrl,
        isOfficial: row.isOfficial,
        modes: [],
      }
      byId.set(row.id, item)
    }
    if (row.modeId && row.modeCode && row.modeShortName) {
      item.modes.push({ id: row.modeId, code: row.modeCode, shortName: row.modeShortName })
    }
  }

  return [...byId.values()]
}

export async function listModes(ctx: OrgContext) {
  return withRls(ctx.userId, (tx) =>
    tx
      .select({ id: modes.id, code: modes.code, name: modes.name, shortName: modes.shortName })
      .from(modes)
      .where(eq(modes.isActive, true))
      .orderBy(asc(modes.sortOrder)),
  )
}
