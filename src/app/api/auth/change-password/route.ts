import { NextRequest } from 'next/server'
import { db, users } from '@/lib/db'
import { getAuthUser, unauthorized, hashPassword, verifyPassword } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return unauthorized()
  const { old_password, new_password } = await req.json()
  const [user] = await db.select().from(users).where(eq(users.id, authUser.userId))
  if (!user || !await verifyPassword(old_password, user.hashedPassword)) {
    return Response.json({ detail: 'Неверный текущий пароль' }, { status: 400 })
  }
  const hashed = await hashPassword(new_password)
  await db.update(users).set({ hashedPassword: hashed }).where(eq(users.id, user.id))
  return Response.json({ ok: true })
}
