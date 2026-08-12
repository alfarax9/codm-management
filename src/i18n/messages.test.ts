import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import en from '../../messages/en.json' with { type: 'json' }
import id from '../../messages/id.json' with { type: 'json' }

import { LOCALES } from './config'

type Messages = Record<string, unknown>

/** Semua kunci terjemahan sebagai jalur bertitik: `auth.messages.invalidEmail`. */
function flatten(obj: Messages, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value as Messages, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

/** Placeholder `{email}` di dalam sebuah pesan. */
function placeholders(text: string): Set<string> {
  return new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))
}

function valueAt(obj: Messages, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => (acc as Messages)?.[part], obj)
}

describe('file terjemahan', () => {
  const idKeys = flatten(id as Messages)
  const enKeys = flatten(en as Messages)

  it('punya kumpulan kunci yang sama persis', () => {
    const missingInEn = idKeys.filter((k) => !enKeys.includes(k))
    const missingInId = enKeys.filter((k) => !idKeys.includes(k))

    assert.deepEqual(missingInEn, [], `Belum diterjemahkan ke Inggris: ${missingInEn.join(', ')}`)
    assert.deepEqual(missingInId, [], `Belum diterjemahkan ke Indonesia: ${missingInId.join(', ')}`)
  })

  it('memakai placeholder yang sama di kedua bahasa', () => {
    // Placeholder yang tertinggal saat menerjemahkan akan tampil mentah sebagai
    // "{email}" di layar — kelihatan seperti bug, dan hanya di satu bahasa.
    for (const key of idKeys) {
      const a = valueAt(id as Messages, key)
      const b = valueAt(en as Messages, key)
      if (typeof a !== 'string' || typeof b !== 'string') continue

      assert.deepEqual(
        [...placeholders(a)].sort(),
        [...placeholders(b)].sort(),
        `Placeholder berbeda pada kunci "${key}"`,
      )
    }
  })

  it('menyediakan satu file per bahasa yang terdaftar', () => {
    const files = readdirSync(join(process.cwd(), 'messages'))
    for (const locale of LOCALES) {
      assert.ok(files.includes(`${locale}.json`), `messages/${locale}.json tidak ada`)
    }
  })
})

describe('teks antarmuka', () => {
  /**
   * Menjaga aturan yang mudah dilanggar tanpa sadar: begitu ada satu kalimat
   * ditulis langsung di kode, bagian itu berhenti mengikuti pilihan bahasa
   * pengguna — dan tidak ada yang menyadarinya sampai ada yang memakai bahasa lain.
   */
  it('tidak menulis kalimat langsung di Server Action', () => {
    const roots = ['src/features', 'src/lib', 'src/app']
    const offenders: string[] = []

    const walk = (dir: string) => {
      for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`
        if (entry.isDirectory()) {
          walk(rel)
          continue
        }
        if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.includes('.test.')) continue
        // email-test.ts adalah skrip CLI, bukan antarmuka pengguna.
        if (rel.includes('email-test')) continue

        const source = readFileSync(join(process.cwd(), rel), 'utf8')
        const withoutComments = source
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '')

        // Kalimat panjang berhuruf kapital yang diakhiri titik di dalam string.
        for (const match of withoutComments.matchAll(/'[A-Z][a-zA-Z ,—-]{18,}\.'/g)) {
          offenders.push(`${rel}: ${match[0]}`)
        }
      }
    }

    roots.forEach(walk)
    assert.deepEqual(
      offenders,
      [],
      `Kalimat berikut harus dipindah ke messages/*.json:\n${offenders.join('\n')}`,
    )
  })
})
