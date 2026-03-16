import { NextRequest } from 'next/server'
import { db, users } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'
import { count } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const [{ value }] = await db.select({ value: count() }).from(users)
    if (value > 0) {
      return Response.json({ detail: 'Регистрация закрыта' }, { status: 403 })
    }
    const { username, password } = await req.json()
    if (!username || !password) {
      return Response.json({ detail: 'Укажите логин и пароль' }, { status: 400 })
    }
    const hashed = await hashPassword(password)
    const [user] = await db.insert(users).values({ username, hashedPassword: hashed }).returning()
    const token = await createToken(user.id, user.username)
    return Response.json({ access_token: token })
  } catch (e) {
    console.error('Register error:', e)
    return Response.json({ detail: 'Ошибка сервера', error: String(e) }, { status: 500 })
  }
}
