import { NextRequest } from 'next/server'
import { db, notificationRules } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const rules = await db.select().from(notificationRules)
  return Response.json(rules)
}

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const data = await req.json()
  const [rule] = await db.insert(notificationRules).values(data).returning()
  return Response.json(rule)
}
