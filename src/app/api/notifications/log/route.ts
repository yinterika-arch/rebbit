import { NextRequest } from 'next/server'
import { db, notificationLog } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { desc } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const logs = await db.select().from(notificationLog).orderBy(desc(notificationLog.sentAt)).limit(limit)
  return Response.json(logs)
}
