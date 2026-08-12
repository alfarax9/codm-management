import { z } from 'zod'

/**
 * Pesan validasi berupa KUNCI terjemahan (`auth.messages.*`), bukan kalimat jadi.
 * Server Action yang memakai skema ini menerjemahkannya sesuai bahasa aktif —
 * kalau kalimatnya ditulis langsung di sini, pengguna English akan tetap
 * menerima pesan Bahasa Indonesia.
 */

/**
 * Panjang minimal 8 mengikuti rekomendasi NIST SP 800-63B: panjang lebih
 * menentukan daripada wajib simbol dan angka, yang justru mendorong pola
 * tertebak seperti "Password1!".
 *
 * Batas atas 72 karena bcrypt yang dipakai Supabase memotong di byte ke-72 —
 * tanpa batas ini, dua kata sandi berbeda bisa dianggap sama.
 */
export const passwordSchema = z
  .string()
  .min(8, 'passwordTooShort')
  .max(72, 'passwordTooLong')

export const emailSchema = z.email({ message: 'invalidEmail' })

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'passwordRequired'),
})

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  })

export const setPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'passwordMismatch',
    path: ['confirmPassword'],
  })
