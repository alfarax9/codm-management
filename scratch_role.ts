import { eq } from 'drizzle-orm'
import { db } from './src/db'
import { profiles, orgMembers, teamMembers } from './src/db/schema/org'

async function main() {
  const email = 'maulanaalfara38@gmail.com'
  
  const users = await db.select().from(profiles).where(eq(profiles.email, email))
  if (users.length === 0) {
    console.log('User not found.')
    process.exit(0)
  }
  
  const u = users[0]
  const orgRels = await db.select().from(orgMembers).where(eq(orgMembers.userId, u.id))
  const teamRels = await db.select().from(teamMembers).where(eq(teamMembers.userId, u.id))
  
  console.log('User ID:', u.id)
  console.log('Org Memberships:', orgRels)
  console.log('Team Memberships:', teamRels)
  
  process.exit(0)
}

main().catch(console.error)
