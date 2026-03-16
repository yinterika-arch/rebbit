import { NextRequest } from 'next/server'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { sendTelegram, sendEmail } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  const { channel, telegram_chat_id, email_address } = await req.json()
  const message = '🐇 WebRebbit: тестовое уведомление работает!'
  const results: Record<string, unknown> = {}

  if (channel === 'telegram' || channel === 'both') {
    const chatId = telegram_chat_id || process.env.TELEGRAM_CHAT_ID || ''
    results.telegram = await sendTelegram(chatId, message)
  }
  if (channel === 'email' || channel === 'both') {
    const to = email_address || process.env.EMAIL_USERNAME || ''
    results.email = await sendEmail(to, 'Тест WebRebbit', message)
  }
  return Response.json(results)
}
