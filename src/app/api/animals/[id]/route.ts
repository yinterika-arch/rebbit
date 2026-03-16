import { NextRequest } from 'next/server'
import { db, animals, litters } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq, count, max } from 'drizzle-orm'

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
  return { ...animal, age_str: ageStr(animal.dob), litter_count: stats?.cnt ?? 0, last_litter_date: stats?.last ?? null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const [animal] = await db.select().from(animals).where(eq(animals.id, parseInt(params.id)))
  if (!animal) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  return Response.json(await enrich(animal))
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const data = await req.json()
  const [animal] = await db.update(animals).set({ ...data, updatedAt: new Date() })
    .where(eq(animals.id, parseInt(params.id))).returning()
  if (!animal) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  return Response.json(await enrich(animal))
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  await db.delete(animals).where(eq(animals.id, parseInt(params.id)))
  return Response.json({ ok: true })
}
