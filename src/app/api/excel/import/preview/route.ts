import { NextRequest } from 'next/server'
import { db, animals, litters } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return Response.json({ detail: 'Файл не найден' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })

    // Parse tribe sheet
    const tribeSheet = wb.Sheets['племя'] || wb.Sheets['Племя'] || wb.Sheets[wb.SheetNames[0]]
    const tribeRows: Record<string, string | null>[] = []
    if (tribeSheet) {
      const rows = XLSX.utils.sheet_to_json(tribeSheet, { header: 1, raw: false }) as string[][]
      for (const r of rows.slice(1)) {
        if (!r[0]) continue
        tribeRows.push({
          nickname: r[0] || '',
          dob: r[1] || null,
          origin: r[3] || null,
          fatherName: r[4] || null,
          fatherOrigin: r[5] || null,
          motherName: r[6] || null,
          motherOrigin: r[7] || null,
          arrivedDate: r[8] || null,
          culledDate: r[9] || null,
        })
      }
    }

    // Parse litters sheet
    const littersSheet = wb.Sheets['окролы'] || wb.Sheets['Окролы'] || wb.Sheets[wb.SheetNames[1]]
    const littersRows: Record<string, string | number | null>[] = []
    if (littersSheet) {
      const rows = XLSX.utils.sheet_to_json(littersSheet, { header: 1, raw: false }) as string[][]
      for (const r of rows.slice(1)) {
        if (!r[0] && !r[5]) continue
        littersRows.push({
          matingPlanned: r[0] || null,
          matingActual: r[1] || null,
          controlPlanned: r[2] || null,
          controlActual: r[3] || null,
          birthPlanned: r[4] || null,
          birthActual: r[5] || null,
          kitCount: r[8] ? parseInt(r[8]) : null,
          doeName: r[16] || null,
          buckName: r[17] || null,
        })
      }
    }

    // Compare with existing data
    const existingAnimals = await db.select().from(animals)
    const animalNames = new Set(existingAnimals.map(a => a.nickname.toLowerCase()))

    const existingLitters = await db.select().from(litters)

    const items: { action: 'create' | 'update' | 'skip'; entity_type: string; identifier: string; changes: Record<string, unknown> }[] = []

    for (const row of tribeRows) {
      const exists = animalNames.has((row.nickname || '').toLowerCase())
      items.push({
        action: exists ? 'skip' : 'create',
        entity_type: 'Животное',
        identifier: row.nickname || '',
        changes: {},
      })
    }

    for (const row of littersRows) {
      const birthDate = row.birthActual || row.birthPlanned || ''
      const doeName = row.doeName || '?'
      const identifier = `${doeName} / ${birthDate}`
      const exists = existingLitters.some(l =>
        (l.birthActual === birthDate || l.birthPlanned === birthDate) &&
        existingAnimals.find(a => a.id === l.doeId)?.nickname?.toLowerCase() === (row.doeName as string || '').toLowerCase()
      )
      items.push({
        action: exists ? 'skip' : 'create',
        entity_type: 'Окрол',
        identifier,
        changes: {},
      })
    }

    const summary = {
      create: items.filter(i => i.action === 'create').length,
      update: items.filter(i => i.action === 'update').length,
      skip: items.filter(i => i.action === 'skip').length,
    }

    // Encode full data into preview_id
    const previewId = Buffer.from(JSON.stringify({ tribe: tribeRows, litters: littersRows })).toString('base64')

    return Response.json({ preview_id: previewId, items, summary })
  } catch (e) {
    console.error('Import preview error:', e)
    return Response.json({ detail: `Ошибка чтения файла: ${e}` }, { status: 400 })
  }
}
