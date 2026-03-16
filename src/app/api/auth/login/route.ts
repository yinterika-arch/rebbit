import { NextRequest } from 'next/server'
import { db, users } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    const [user] = await db.select().from(users).where(eq(users.username, username))
    if (!user || !await verifyPassword(password, user.hashedPassword)) {
      return Response.json({ detail: 'Неверный логин или пароль' }, { status: 401 })
    }
    const token = await createToken(user.id, user.username)
    return Response.json({ access_token: token })
  } catch (e) {
    console.error('Login error:', e)
    return Response.json({ detail: 'Ошибка сервера', error: String(e) }, { status: 500 })
  }
}
