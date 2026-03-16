import { NextRequest } from 'next/server'
import { db, litters, animals } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function enrichLitter(litter: typeof litters.$inferSelect, doe?: typeof animals.$inferSelect | null, buck?: typeof animals.$inferSelect | null) {
  const today = new Date().toISOString().split('T')[0]
  const birth = litter.birthActual

  const daysSinceBirth = birth
    ? Math.floor((new Date(today).getTime() - new Date(birth).getTime()) / 86400000)
    : null

  const day29Date = birth ? addDays(birth, 29) : null
  const day100Date = birth ? addDays(birth, 100) : null
  const day120Date = birth ? addDays(birth, 120) : null

  return {
    ...litter,
    doe_nickname: doe?.nickname ?? null,
    buck_nickname: buck?.nickname ?? null,
    days_since_birth: daysSinceBirth,
    day29_date: day29Date,
    day100_date: day100Date,
    day120_date: day120Date,
    day29_remaining: day29Date ? Math.floor((new Date(day29Date).getTime() - new Date(today).getTime()) / 86400000) : null,
    day100_remaining: day100Date ? Math.floor((new Date(day100Date).getTime() - new Date(today).getTime()) / 86400000) : null,
    day120_remaining: day120Date ? Math.floor((new Date(day120Date).getTime() - new Date(today).getTime()) / 86400000) : null,
  }
}

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const doeId = searchParams.get('doe_id')
  const active = searchParams.get('active') !== 'false'

  let rows = await db.select().from(litters)
  if (doeId) rows = rows.filter(l => l.doeId === parseInt(doeId))
  if (active) rows = rows.filter(l => !l.slaughterFlag)
  rows.sort((a, b) => {
    const da = a.birthActual || a.birthPlanned || ''
    const db2 = b.birthActual || b.birthPlanned || ''
    return db2.localeCompare(da)
  })

  const allAnimals = await db.select().from(animals)
  const animalMap = new Map(allAnimals.map(a => [a.id, a]))

  return Response.json(rows.map(l => enrichLitter(l, animalMap.get(l.doeId ?? -1), animalMap.get(l.buckId ?? -1))))
}

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const data = await req.json()
  const [litter] = await db.insert(litters).values(data).returning()
  const doe = litter.doeId ? (await db.select().from(animals).where(eq(animals.id, litter.doeId)))[0] : null
  const buck = litter.buckId ? (await db.select().from(animals).where(eq(animals.id, litter.buckId)))[0] : null
  return Response.json(enrichLitter(litter, doe, buck))
}
