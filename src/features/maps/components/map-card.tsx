'use client'

import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { deleteMap } from '@/features/maps/actions'
import type { MapListItem } from '@/features/maps/queries'

import { MapFormDialog } from './map-form-dialog'

type Mode = { id: string; code: string; name: string; shortName: string }

export function MapCard({
  map,
  modes,
  canManage,
}: {
  map: MapListItem
  modes: Mode[]
  canManage: boolean
}) {
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMap(map.id)
      if (result.error) toast.error(result.error)
      else toast.success(result.message)
    })
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="relative aspect-video bg-secondary">
        {map.imageUrl ? (
          <Image
            src={map.imageUrl}
            alt={map.name}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Tanpa gambar
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{map.name}</p>
            <p className="text-xs text-muted-foreground">
              {map.isOfficial ? 'Resmi' : 'Kustom'}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {map.modes.map((mode) => (
              <Badge key={mode.id} variant="secondary">
                {mode.shortName}
              </Badge>
            ))}
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <MapFormDialog
              modes={modes}
              map={map}
              trigger={
                <Button variant="outline" size="sm" className="flex-1">
                  Ubah
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={pending}
              aria-label={`Hapus ${map.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
