import { NextRequest } from 'next/server'
import { db, weighings } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const data = await req.json()
  const w: number[] = data.weights || []
  if (w.length) {
    data.kitCount = w.length
    data.totalWeight = w.reduce((s: number, v: number) => s + v, 0).toFixed(3)
    data.avgWeight = (w.reduce((s: number, v: number) => s + v, 0) / w.length).toFixed(3)
  }
  const [weighing] = await db.update(weighings).set(data).where(eq(weighings.id, parseInt(params.id))).returning()
  if (!weighing) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  return Response.json(weighing)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  await db.delete(weighings).where(eq(weighings.id, parseInt(params.id)))
  return Response.json({ ok: true })
}
