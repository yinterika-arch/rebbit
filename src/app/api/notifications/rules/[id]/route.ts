import { NextRequest } from 'next/server'
import { db, notificationRules } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const data = await req.json()
  const [rule] = await db.update(notificationRules).set({ ...data, updatedAt: new Date() })
    .where(eq(notificationRules.id, parseInt(params.id))).returning()
  if (!rule) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  return Response.json(rule)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  await db.delete(notificationRules).where(eq(notificationRules.id, parseInt(params.id)))
  return Response.json({ ok: true })
}
