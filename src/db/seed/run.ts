import 'dotenv/config'
import { eq } from 'drizzle-orm'

import { db } from '..'
import type { Tx } from '../rls'
import { organizations } from '../schema'
import { seedOrgReference } from './seed-org'

/**
 * Mengisi data referensi untuk organisasi yang sudah ada:
 *
 *   npm run db:seed -- <org-id>
 *
 * Organisasi yang dibuat lewat aplikasi sudah di-seed otomatis. Skrip ini untuk
 * mengisi ulang organisasi lama atau setelah menambah data referensi baru.
 */
async function main(orgId: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1)
  if (!org) throw new Error(`Organisasi ${orgId} tidak ditemukan.`)

  console.log(`Seeding untuk organisasi "${org.name}"…`)
  const result = await db.transaction((tx) => seedOrgReference(tx as Tx, orgId))
  console.log(result.created ? 'Ruleset WC 2026 dibuat.' : 'Ruleset WC 2026 sudah ada — dilewati.')
  console.log('Selesai.')
}

const orgId = process.argv[2]
if (!orgId) {
  console.error('Pemakaian: npm run db:seed -- <org-id>')
  process.exit(1)
}

main(orgId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
