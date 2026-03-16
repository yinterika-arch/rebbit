import { NextRequest } from 'next/server'
import { db, animals, litters, weighings } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getAuthUser(req)) return unauthorized()
  const doeId = parseInt(params.id)

  const [animal] = await db.select().from(animals).where(eq(animals.id, doeId))
  if (!animal) return Response.json({ detail: 'Не найдено' }, { status: 404 })

  const doeL = await db.select().from(litters).where(eq(litters.doeId, doeId))
  doeL.sort((a, b) => (b.birthActual || '').localeCompare(a.birthActual || ''))

  const litterId_list = doeL.map(l => l.id)
  const allWeighings = litterId_list.length
    ? await db.select().from(weighings)
    : []
  const filteredWeighings = allWeighings.filter(w => litterId_list.includes(w.litterId))

  const weighingsByLitter = new Map<number, { w1: typeof weighings.$inferSelect | null; w2: typeof weighings.$inferSelect | null }>()
  for (const litter of doeL) {
    const lw = filteredWeighings.filter(w => w.litterId === litter.id)
    weighingsByLitter.set(litter.id, {
      w1: lw.find(w => w.weighingNumber === 1) ?? null,
      w2: lw.find(w => w.weighingNumber === 2) ?? null,
    })
  }

  const totalKits = doeL.reduce((s, l) => s + (l.kitCount || 0), 0)
  const avgKitCount = doeL.length ? totalKits / doeL.length : 0

  const w1Weights = filteredWeighings.filter(w => w.weighingNumber === 1 && w.avgWeight)
  const w2Weights = filteredWeighings.filter(w => w.weighingNumber === 2 && w.avgWeight)
  const avgW1 = w1Weights.length ? w1Weights.reduce((s, w) => s + parseFloat(String(w.avgWeight)), 0) / w1Weights.length : null
  const avgW2 = w2Weights.length ? w2Weights.reduce((s, w) => s + parseFloat(String(w.avgWeight)), 0) / w2Weights.length : null

  let totalDefective = 0
  for (const litter of doeL) {
    const wmap = weighingsByLitter.get(litter.id)
    if (wmap?.w1?.kitCount && wmap?.w2?.kitCount) {
      totalDefective += wmap.w1.kitCount - wmap.w2.kitCount
    }
  }

  return Response.json({
    animal,
    litter_count: doeL.length,
    litters: doeL,
    total_kits: totalKits,
    avg_kit_count: Math.round(avgKitCount * 10) / 10,
    weighings: doeL.map(l => ({ litter_id: l.id, ...weighingsByLitter.get(l.id) })),
    total_defective: totalDefective,
    avg_w1_weight: avgW1 ? Math.round(avgW1 * 1000) / 1000 : null,
    avg_w2_weight: avgW2 ? Math.round(avgW2 * 1000) / 1000 : null,
  })
}
