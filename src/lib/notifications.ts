import nodemailer from 'nodemailer'

function formatDate(d: string | null): string {
  if (!d) return '—'
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  const dt = new Date(d)
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

export function makeMessage(rule: {
  event_type: string
  days_offset: number
  name: string
}, litter: {
  doe_name: string | null
  birth_actual: string | null
  birth_planned: string | null
  mating_planned: string | null
  kit_count: number | null
}): string {
  const doe = litter.doe_name || '?'
  const count = litter.kit_count || '?'
  const offset = rule.days_offset

  if (rule.event_type === 'birth_actual') {
    const birth = formatDate(litter.birth_actual)
    if (offset === 29) return `🐇 ${doe}: отсадка — ${offset} дней от окрола (${birth}). Крольчат: ${count}.`
    if (offset === 100) return `📅 ${doe}: 100 дней от окрола (${birth}). Взвешивание и приборка. Крольчат: ${count}.`
    if (offset === 120) return `🔪 ${doe}: 120 дней от окрола (${birth}). Время забоя. Крольчат: ${count}.`
    return `🐇 ${doe}: ${offset} дней от окрола (${birth}).`
  }
  if (rule.event_type === 'birth_plan') {
    const d = formatDate(litter.birth_planned)
    return offset < 0
      ? `📋 ${doe}: плановый окрол через ${Math.abs(offset)} д. (${d}).`
      : `📋 ${doe}: плановый окрол ${d}.`
  }
  if (rule.event_type === 'mating_plan') {
    const d = formatDate(litter.mating_planned)
    return offset < 0
      ? `💕 ${doe}: плановая вязка через ${Math.abs(offset)} д. (${d}).`
      : `💕 ${doe}: плановая вязка ${d}.`
  }
  return `📌 ${rule.name}: крольчиха ${doe}.`
}

export async function sendTelegram(chatId: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !chatId) return { ok: false, error: 'Токен или chat_id не настроен' }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
    const data = await res.json()
    if (!data.ok) return { ok: false, error: data.description }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export async function sendEmail(to: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD, EMAIL_FROM } = process.env
  if (!EMAIL_USERNAME || !to) return { ok: false, error: 'Email не настроен' }
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(EMAIL_PORT || '587'),
      secure: false,
      auth: { user: EMAIL_USERNAME, pass: EMAIL_PASSWORD },
    })
    await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USERNAME,
      to,
      subject,
      text: body,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
