import { NextRequest } from 'next/server'
import { getAuthUser, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const days = searchParams.get('days') || '30'
  const res = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/litters/upcoming?days=${days}`, {
    headers: { authorization: req.headers.get('authorization') || '' }
  })
  return Response.json(await res.json())
}
