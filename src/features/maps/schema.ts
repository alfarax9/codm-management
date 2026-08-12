import { z } from 'zod'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/**
 * Batas ukuran dan tipe sengaja dicek di sini juga, bukan hanya di bucket
 * Storage. Kalau hanya dicek di Storage, user baru tahu file-nya ditolak
 * setelah menunggu unggahan selesai.
 */
const imageFile = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_IMAGE_BYTES, 'Ukuran gambar maksimal 5 MB.')
  .refine((f) => IMAGE_TYPES.includes(f.type), 'Gambar harus PNG, JPEG, atau WebP.')

/** File kosong dari input `<input type="file">` yang tidak diisi. */
const optionalImage = z
  .instanceof(File)
  .transform((f) => (f.size === 0 ? undefined : f))
  .pipe(imageFile.optional())

export const mapFormSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2, 'Nama map minimal 2 karakter.').max(60),
  modeIds: z.array(z.uuid()).min(1, 'Pilih minimal satu mode.'),
  image: optionalImage,
  minimap: optionalImage,
})

export type MapFormInput = z.infer<typeof mapFormSchema>

/** FormData → objek untuk divalidasi. Checkbox mode dikirim berulang dengan nama sama. */
export function parseMapFormData(formData: FormData) {
  return mapFormSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    modeIds: formData.getAll('modeIds'),
    image: formData.get('image') ?? new File([], ''),
    minimap: formData.get('minimap') ?? new File([], ''),
  })
}
