import { NextRequest } from 'next/server'
import { db, litters, notificationRules, notificationLog, animals } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { sendTelegram, sendEmail, makeMessage } from '@/lib/notifications'

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
  // Secured by Vercel Cron secret header
  const cronSecret = req.headers.get('x-vercel-cron-secret') || req.headers.get('authorization')
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const rules = await db.select().from(notificationRules).where(eq(notificationRules.enabled, true))
  const allLitters = await db.select().from(litters).where(eq(litters.slaughterFlag, false))
  const allAnimals = await db.select().from(animals)
  const animalMap = new Map(allAnimals.map(a => [a.id, a]))

  let sent = 0
  for (const rule of rules) {
    for (const litter of allLitters) {
      const eventDate = getEventDate(rule, litter)
      if (!eventDate || eventDate !== today) continue

      // Check already sent
      const existing = await db.select().from(notificationLog)
        .where(and(
          eq(notificationLog.ruleId, rule.id),
          eq(notificationLog.litterId, litter.id),
          eq(notificationLog.eventDate, today),
        ))
      if (existing.length > 0) continue

      const doe = animalMap.get(litter.doeId ?? -1)
      const message = makeMessage(
        { event_type: rule.eventType ?? '', days_offset: rule.daysOffset ?? 0, name: rule.name },
        { doe_name: doe?.nickname ?? null, birth_actual: litter.birthActual, birth_planned: litter.birthPlanned, mating_planned: litter.matingPlanned, kit_count: litter.kitCount }
      )

      const chatId = rule.telegramChatId || process.env.TELEGRAM_CHAT_ID || ''
      const email = rule.emailAddress || process.env.EMAIL_USERNAME || ''

      const channels: { type: string; target: string }[] = []
      if (rule.channel === 'telegram' || rule.channel === 'both') channels.push({ type: 'telegram', target: chatId })
      if (rule.channel === 'email' || rule.channel === 'both') channels.push({ type: 'email', target: email })

      for (const ch of channels) {
        let result: { ok: boolean; error?: string }
        if (ch.type === 'telegram') {
          result = await sendTelegram(ch.target, message)
        } else {
          result = await sendEmail(ch.target, rule.name, message)
        }
        await db.insert(notificationLog).values({
          ruleId: rule.id,
          litterId: litter.id,
          eventDate: today,
          message,
          channel: ch.type,
          status: result.ok ? 'sent' : 'failed',
          errorMessage: result.error || null,
        })
        if (result.ok) sent++
      }
    }
  }

  return Response.json({ ok: true, sent, date: today })
}
