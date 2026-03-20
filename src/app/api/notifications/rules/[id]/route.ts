import { NextRequest } from 'next/server'
import { db, notificationRules } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

function toSnake(rule: typeof notificationRules.$inferSelect) {
  return {
    ...rule,
    days_offset: rule.daysOffset,
    event_type: rule.eventType,
    send_time: rule.sendTime,
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const d = await req.json()
  const [rule] = await db.update(notificationRules).set({
    name: d.name,
    description: d.description,
    eventType: d.event_type,
    daysOffset: d.days_offset ?? 0,
    channel: d.channel,
    sendTime: d.send_time,
    enabled: d.enabled,
    updatedAt: new Date(),
  }).where(eq(notificationRules.id, parseInt(params.id))).returning()
  if (!rule) return Response.json({ detail: 'Не найдено' }, { status: 404 })
  return Response.json(toSnake(rule))
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  await db.delete(notificationRules).where(eq(notificationRules.id, parseInt(params.id)))
  return Response.json({ ok: true })
}
