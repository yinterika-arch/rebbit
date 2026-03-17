import { NextRequest } from 'next/server'
import { db, litters, animals, weighings } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

async function enrichLitter(litter: typeof litters.$inferSelect, doe?: typeof animals.$inferSelect | null, buck?: typeof animals.$inferSelect | null) {
  const today = new Date().toISOString().split('T')[0]
  const birth = litter.birthActual
  const day29Date = birth ? addDays(birth, 29) : null
  const day60Date = birth ? addDays(birth, 60) : null
  const day100Date = birth ? addDays(birth, 100) : null
  const litterWeighings = await db.select().from(weighings).where(eq(weighings.litterId, litter.id))
  return {
    ...litter,
    doe_nickname: doe?.nickname ?? null,
    buck_nickname: buck?.nickname ?? null,
    days_since_birth: birth ? Math.floor((new Date(today).getTime() - new Date(birth).getTime()) / 86400000) : null,
    day29_date: day29Date,
    day60_date: day60Date,
    day100_date: day100Date,
    day29_remaining: day29Date ? Math.floor((new Date(day29Date).getTime() - new Date(today).getTime()) / 86400000) : null,
    day60_remaining: day60Date ? Math.floor((new Date(day60Date).getTime() - new Date(today).getTime()) / 86400000) : null,
    day100_remaining: day100Date ? Math.floor((new Date(day100Date).getTime() - new Date(today).getTime()) / 86400000) : null,
    weighings: litterWeighings.sort((a, b) => a.weighingNumber - b.weighingNumber),
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const [litter] = await db.select().from(litters).where(eq(litters.id, parseInt(params.id)))
  if (!litter) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  const doe = litter.doeId ? (await db.select().from(animals).where(eq(animals.id, litter.doeId)))[0] : null
  const buck = litter.buckId ? (await db.select().from(animals).where(eq(animals.id, litter.buckId)))[0] : null
  return Response.json(await enrichLitter(litter, doe, buck))
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const data = await req.json()
  const [litter] = await db.update(litters).set({ ...data, updatedAt: new Date() })
    .where(eq(litters.id, parseInt(params.id))).returning()
  if (!litter) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  const doe = litter.doeId ? (await db.select().from(animals).where(eq(animals.id, litter.doeId)))[0] : null
  const buck = litter.buckId ? (await db.select().from(animals).where(eq(animals.id, litter.buckId)))[0] : null
  return Response.json(await enrichLitter(litter, doe, buck))
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  await db.delete(litters).where(eq(litters.id, parseInt(params.id)))
  return Response.json({ ok: true })
}
