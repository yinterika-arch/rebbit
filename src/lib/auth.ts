import { SignJWT, jwtVerify } from 'jose'
import { hash, compare } from 'bcryptjs'
import { NextRequest } from 'next/server'

const SECRET = new TextEncoder().encode(
  process.env.SECRET_KEY || 'fallback-secret-change-in-production'
)

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed)
}

export async function createToken(userId: number, username: string): Promise<string> {
  return new SignJWT({ userId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: number; username: string }
  } catch {
    return null
  }
}

export async function getAuthUser(req: NextRequest): Promise<{ userId: number; username: string } | null> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.slice(7))
}

export function unauthorized() {
  return Response.json({ detail: 'Не авторизован' }, { status: 401 })
}
