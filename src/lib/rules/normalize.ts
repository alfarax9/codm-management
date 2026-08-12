/**
 * Kunci pencocokan aturan. Dokumen ruleset ditulis manusia dan ejaannya tidak konsisten
 * ("Molotov Cocktail" dengan spasi di depan, "3-Line Rifle" vs "3 Line Rifle",
 * tanda kutip melengkung dari hasil OCR). Semua perbandingan aturan memakai bentuk
 * ternormalisasi ini, bukan teks mentahnya.
 */
export function normalizeItemKey(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[‘’“”]/g, '') // kutip melengkung dari OCR
    .replace(/[^\p{L}\p{N}]+/gu, ' ') // sisakan huruf & angka
    .trim()
    .toLowerCase()
}
