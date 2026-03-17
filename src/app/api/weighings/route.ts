import { NextRequest } from 'next/server'
import { db, weighings } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const litterId = searchParams.get('litter_id')
  let rows = await db.select().from(weighings)
  if (litterId) rows = rows.filter(w => w.litterId === parseInt(litterId))
  return Response.json(rows)
}

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { litter_id, weighing_number, weighing_type, weighing_date, weights, notes } = await req.json()
  const w: number[] = weights || []
  const kitCount = w.length
  const totalWeight = w.reduce((s, v) => s + v, 0)
  const avgWeight = kitCount > 0 ? totalWeight / kitCount : 0
  const minWeight = kitCount > 0 ? Math.min(...w) : 0
  const maxWeight = kitCount > 0 ? Math.max(...w) : 0

  const [weighing] = await db.insert(weighings).values({
    litterId: litter_id,
    weighingNumber: weighing_number || 1,
    weighingType: weighing_type || null,
    weighingDate: weighing_date || null,
    weights: w,
    kitCount,
    minWeight: minWeight.toFixed(3),
    maxWeight: maxWeight.toFixed(3),
    avgWeight: avgWeight.toFixed(3),
    totalWeight: totalWeight.toFixed(3),
    notes: notes || null,
  }).returning()
  return Response.json(weighing)
}
