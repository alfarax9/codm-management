import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { MapCard } from '@/features/maps/components/map-card'
import { MapFormDialog } from '@/features/maps/components/map-form-dialog'
import { listMaps, listModes } from '@/features/maps/queries'
import { requireOrg } from '@/lib/auth/session'

export default async function MapsPage() {
  const ctx = await requireOrg()
  const [maps, modes, t] = await Promise.all([
    listMaps(ctx),
    listModes(ctx),
    getTranslations('maps'),
  ])

  const canManage = ['owner', 'admin', 'coach'].includes(ctx.role)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('count', { count: maps.length })}</p>
        </div>
        {canManage && (
          <MapFormDialog modes={modes} trigger={<Button>{t('upload')}</Button>} />
        )}
      </div>

      {maps.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {maps.map((map) => (
            <MapCard key={map.id} map={map} modes={modes} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  )
}
