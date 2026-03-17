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

  const ageStr = animal.dob ? (() => {
    const born = new Date(animal.dob)
    const now = new Date()
    const days = Math.floor((now.getTime() - born.getTime()) / 86400000)
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    const d = days % 30
    const parts = []
    if (years > 0) parts.push(`${years}г`)
    if (months > 0) parts.push(`${months}мес`)
    if (d > 0 || parts.length === 0) parts.push(`${d}д`)
    return parts.join(' ')
  })() : null

  const litterItems = doeL.map(l => {
    const wmap = weighingsByLitter.get(l.id)
    const w1 = wmap?.w1 ?? null
    const w2 = wmap?.w2 ?? null
    const defective = (w1?.kitCount && w2?.kitCount) ? w1.kitCount - w2.kitCount : null
    return {
      litter_id: l.id,
      birth_date: l.birthActual || l.birthPlanned || null,
      kit_count: l.kitCount ?? null,
      w1_avg: w1?.avgWeight ? parseFloat(String(w1.avgWeight)) : null,
      w1_total: w1?.totalWeight ? parseFloat(String(w1.totalWeight)) : null,
      w1_count: w1?.kitCount ?? null,
      w2_avg: w2?.avgWeight ? parseFloat(String(w2.avgWeight)) : null,
      w2_total: w2?.totalWeight ? parseFloat(String(w2.totalWeight)) : null,
      w2_count: w2?.kitCount ?? null,
      defective,
    }
  })

  return Response.json({
    animal: {
      id: animal.id,
      nickname: animal.nickname,
      sex: animal.sex,
      birth_date: animal.dob,
      culled_date: animal.culledDate,
      age_str: ageStr,
    },
    litter_count: doeL.length,
    litters: litterItems,
    total_kits: totalKits,
    avg_kit_count: Math.round(avgKitCount * 10) / 10,
    total_defective: totalDefective,
    avg_w1_weight: avgW1 ? Math.round(avgW1 * 1000) / 1000 : null,
    avg_w2_weight: avgW2 ? Math.round(avgW2 * 1000) / 1000 : null,
  })
}
