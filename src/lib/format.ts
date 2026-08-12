import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 90 → `"01:30"`. Scoreboard CODM menampilkan WAKTU dalam format ini. */
export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const mm = Math.floor(safe / 60)
  const ss = safe % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

/** `"01:30"` → 90. Menerima juga `"1:30"` dan `"90"`. Nilai tak terbaca → 0. */
export function parseDuration(input: string): number {
  const trimmed = input.trim()
  if (!trimmed) return 0
  const parts = trimmed.split(':')
  if (parts.length === 1) return Number(parts[0]) || 0
  const [mm, ss] = parts
  return (Number(mm) || 0) * 60 + (Number(ss) || 0)
}

/** K/D/A gaya scoreboard CODM. */
export function formatKda(kills: number, deaths: number, assists: number): string {
  return `${kills}/${deaths}/${assists}`
}
