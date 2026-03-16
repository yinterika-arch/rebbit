import { NextRequest } from 'next/server'
import { getAuthUser, unauthorized } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  try {
    const form = await req.formData()
    const file = form.get('file') as File
    if (!file) return Response.json({ detail: 'Файл не найден' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer', cellDates: true })

    const preview: Record<string, unknown[]> = {}

    // Parse tribe sheet
    const tribeSheet = wb.Sheets['племя'] || wb.Sheets['Племя'] || wb.Sheets[wb.SheetNames[0]]
    if (tribeSheet) {
      const rows = XLSX.utils.sheet_to_json(tribeSheet, { header: 1, raw: false }) as string[][]
      preview.tribe = rows.slice(1).filter(r => r[0]).map(r => ({
        nickname: r[0] || '',
        dob: r[1] || null,
        origin: r[3] || null,
        fatherName: r[4] || null,
        fatherOrigin: r[5] || null,
        motherName: r[6] || null,
        motherOrigin: r[7] || null,
        arrivedDate: r[8] || null,
        culledDate: r[9] || null,
      }))
    }

    // Parse litters sheet
    const littersSheet = wb.Sheets['окролы'] || wb.Sheets['Окролы'] || wb.Sheets[wb.SheetNames[1]]
    if (littersSheet) {
      const rows = XLSX.utils.sheet_to_json(littersSheet, { header: 1, raw: false }) as string[][]
      preview.litters = rows.slice(1).filter(r => r[0] || r[5]).map(r => ({
        matingPlanned: r[0] || null,
        matingActual: r[1] || null,
        controlPlanned: r[2] || null,
        controlActual: r[3] || null,
        birthPlanned: r[4] || null,
        birthActual: r[5] || null,
        kitCount: r[8] ? parseInt(r[8]) : null,
        doeName: r[16] || null,
        buckName: r[17] || null,
      }))
    }

    // Store in session/cache for confirm step (simplified: return preview_id)
    const previewId = Buffer.from(JSON.stringify({ tribe: preview.tribe, litters: preview.litters })).toString('base64').slice(0, 32)

    return Response.json({
      preview_id: previewId,
      tribe_count: (preview.tribe as unknown[])?.length || 0,
      litters_count: (preview.litters as unknown[])?.length || 0,
      tribe_preview: (preview.tribe as unknown[] || []).slice(0, 5),
      litters_preview: (preview.litters as unknown[] || []).slice(0, 5),
      raw_data: JSON.stringify({ tribe: preview.tribe, litters: preview.litters }),
    })
  } catch (e) {
    return Response.json({ detail: `Ошибка чтения файла: ${e}` }, { status: 400 })
  }
}
