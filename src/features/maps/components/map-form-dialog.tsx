'use client'

import { useState, useTransition, type ReactElement } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionState } from '@/features/auth/actions'
import { saveMap } from '@/features/maps/actions'
import type { MapListItem } from '@/features/maps/queries'

type Mode = { id: string; code: string; name: string; shortName: string }

export function MapFormDialog({
  modes,
  map,
  trigger,
}: {
  modes: Mode[]
  map?: MapListItem
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const selectedModeIds = new Set(map?.modes.map((m) => m.id))

  /**
   * Dialog hanya ditutup kalau aksinya berhasil. Kalau gagal, dialog tetap
   * terbuka dengan isian yang sudah diketik dan pesan errornya di dalam form.
   */
  const action = (formData: FormData) => {
    startTransition(async () => {
      const result: ActionState = await saveMap({}, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setError(null)
      setOpen(false)
      toast.success(result.message)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form action={action} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{map ? 'Ubah Map' : 'Tambah Map'}</DialogTitle>
            <DialogDescription>
              Mode yang dicentang menentukan di dropdown mana map ini muncul saat mengisi scrim.
            </DialogDescription>
          </DialogHeader>

          {map && <input type="hidden" name="id" value={map.id} />}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama map</Label>
            <Input id="name" name="name" defaultValue={map?.name} required placeholder="Summit" />
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Dimainkan di mode</legend>
            <div className="flex flex-wrap gap-4">
              {modes.map((mode) => (
                <label key={mode.id} className="flex items-center gap-2 text-sm">
                  {/* Input native: grup checkbox multi-nilai harus terkirim lewat
                      formData.getAll('modeIds'). */}
                  <input
                    type="checkbox"
                    name="modeIds"
                    value={mode.id}
                    defaultChecked={selectedModeIds.has(mode.id)}
                    className="size-4 accent-primary"
                  />
                  {mode.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor="image">Gambar map</Label>
            <Input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="minimap">Denah / minimap</Label>
            <Input id="minimap" name="minimap" type="file" accept="image/png,image/jpeg,image/webp" />
            <p className="text-xs text-muted-foreground">
              Dipakai Strategy Board nanti. Boleh dikosongkan.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
