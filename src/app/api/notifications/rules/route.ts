import { NextRequest } from 'next/server'
import { db, notificationRules } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'

function toSnake(rule: typeof notificationRules.$inferSelect) {
  return {
    ...rule,
    days_offset: rule.daysOffset,
    event_type: rule.eventType,
    send_time: rule.sendTime,
  }
}

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const rules = await db.select().from(notificationRules)
  return Response.json(rules.map(toSnake))
}

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const d = await req.json()
  const [rule] = await db.insert(notificationRules).values({
    name: d.name,
    description: d.description,
    eventType: d.event_type,
    daysOffset: d.days_offset ?? 0,
    channel: d.channel,
    sendTime: d.send_time,
    enabled: d.enabled ?? true,
  }).returning()
  return Response.json(toSnake(rule))
}
