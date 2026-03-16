import { NextRequest } from 'next/server'
import { db, litters, animals, notificationRules } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { makeMessage } from '@/lib/notifications'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getEventDate(rule: typeof notificationRules.$inferSelect, litter: typeof litters.$inferSelect): string | null {
  if (rule.eventType === 'birth_actual' && litter.birthActual) return addDays(litter.birthActual, rule.daysOffset ?? 0)
  if (rule.eventType === 'birth_plan' && litter.birthPlanned) return addDays(litter.birthPlanned, rule.daysOffset ?? 0)
  if (rule.eventType === 'mating_plan' && litter.matingPlanned) return addDays(litter.matingPlanned, rule.daysOffset ?? 0)
  return null
}

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30')
  const today = new Date().toISOString().split('T')[0]
  const deadline = addDays(today, days)

  const rules = await db.select().from(notificationRules).where(eq(notificationRules.enabled, true))
  const allLitters = await db.select().from(litters)
  const allAnimals = await db.select().from(animals)
  const animalMap = new Map(allAnimals.map(a => [a.id, a]))

  const upcoming = []
  for (const rule of rules) {
    for (const litter of allLitters.filter(l => !l.slaughterFlag)) {
      const eventDate = getEventDate(rule, litter)
      if (!eventDate || eventDate < today || eventDate > deadline) continue
      const doe = animalMap.get(litter.doeId ?? -1)
      upcoming.push({
        rule_id: rule.id,
        rule_name: rule.name,
        event_type: rule.eventType,
        litter_id: litter.id,
        doe_name: doe?.nickname ?? null,
        event_date: eventDate,
        days_until: Math.floor((new Date(eventDate).getTime() - new Date(today).getTime()) / 86400000),
        message: makeMessage(
          { event_type: rule.eventType ?? '', days_offset: rule.daysOffset ?? 0, name: rule.name },
          { doe_name: doe?.nickname ?? null, birth_actual: litter.birthActual, birth_planned: litter.birthPlanned, mating_planned: litter.matingPlanned, kit_count: litter.kitCount }
        ),
      })
    }
  }
  upcoming.sort((a, b) => a.event_date.localeCompare(b.event_date))
  return Response.json(upcoming)
}
