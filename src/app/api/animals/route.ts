import { NextRequest } from 'next/server'
import { db, animals, litters } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq, isNull, count, max, and } from 'drizzle-orm'

function ageStr(dob: string | null): string | null {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()
  if (days < 0) { months--; days += 30 }
  if (months < 0) { years--; months += 12 }
  const parts = []
  if (years) parts.push(`${years}г`)
  if (months) parts.push(`${months}мес`)
  if (days || !parts.length) parts.push(`${days}д`)
  return parts.join(' ')
}

async function enrich(animal: typeof animals.$inferSelect) {
  const [stats] = await db
    .select({ cnt: count(), last: max(litters.birthActual) })
    .from(litters)
    .where(eq(litters.doeId, animal.id))
  return {
    ...animal,
    rest_period_days: animal.restPeriodDays,
    arrived_date: animal.arrivedDate,
    culled_date: animal.culledDate,
    father_name: animal.fatherName,
    mother_name: animal.motherName,
    age_str: ageStr(animal.dob),
    litter_count: stats?.cnt ?? 0,
    last_litter_date: stats?.last ?? null,
  }
}

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const sex = searchParams.get('sex')
  const active = searchParams.get('active') !== 'false'

  const conditions = []
  if (sex) conditions.push(eq(animals.sex, sex))
  if (active) conditions.push(isNull(animals.culledDate))

  const rows = await db.select().from(animals).where(conditions.length ? and(...conditions) : undefined)

  const filtered = rows.sort((a, b) => a.nickname.localeCompare(b.nickname))

  return Response.json(await Promise.all(filtered.map(enrich)))
}

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const d = await req.json()
  const [animal] = await db.insert(animals).values({
    nickname: d.nickname,
    sex: d.sex,
    dob: d.dob,
    origin: d.origin,
    fatherName: d.father_name,
    motherName: d.mother_name,
    arrivedDate: d.arrived_date,
    culledDate: d.culled_date,
    restPeriodDays: d.rest_period_days,
    notes: d.notes,
  }).returning()
  return Response.json(await enrich(animal))
}
