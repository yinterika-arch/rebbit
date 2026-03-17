import { NextRequest } from 'next/server'
import { db, animals, litters, weighings } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

// Convert DD.MM.YYYY or DD/MM/YYYY to YYYY-MM-DD
function toIsoDate(val: string | null | undefined): string | null {
  if (!val) return null
  const s = String(val).trim()
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  // DD.MM.YYYY or DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/)
  if (m) {
    const day = m[1].padStart(2, '0')
    const month = m[2].padStart(2, '0')
    const year = m[3].length === 2 ? '20' + m[3] : m[3]
    return `${year}-${month}-${day}`
  }
  return null
}

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  try {
    const { preview_id, mode } = await req.json()
    const { tribe, litters: littersData } = JSON.parse(Buffer.from(preview_id, 'base64').toString('utf-8'))

    let created = 0
    let updated = 0

    // Replace mode: clear all existing data first
    if (mode === 'replace') {
      await db.delete(weighings)
      await db.delete(litters)
      await db.delete(animals)
    }

    // Import animals (upsert — update existing to fix sex/columns)
    if (tribe?.length) {
      for (const row of tribe) {
        if (!row.nickname) continue
        const existing = await db.select().from(animals).where(eq(animals.nickname, row.nickname))
        const values = {
          nickname: row.nickname,
          sex: row.sex || null,
          dob: toIsoDate(row.dob),
          fatherName: row.fatherName || null,
          fatherOrigin: row.fatherOrigin || null,
          motherName: row.motherName || null,
          motherOrigin: row.motherOrigin || null,
          arrivedDate: toIsoDate(row.arrivedDate),
          culledDate: toIsoDate(row.culledDate),
        }
        if (existing.length === 0) {
          await db.insert(animals).values(values)
          created++
        } else {
          await db.update(animals).set(values).where(eq(animals.nickname, row.nickname))
          updated++
        }
      }
    }

    // Import litters
    if (littersData?.length) {
      const allAnimals = await db.select().from(animals)
      const animalByName = new Map(allAnimals.map(a => [a.nickname.toLowerCase(), a]))

      for (const row of littersData) {
        if (!row.birthActual && !row.birthPlanned) continue
        if (!row.doeName) continue
        const doe = row.doeName ? animalByName.get((row.doeName as string).toLowerCase()) : null
        const buck = row.buckName ? animalByName.get((row.buckName as string).toLowerCase()) : null
        await db.insert(litters).values({
          doeId: doe?.id ?? null,
          buckId: buck?.id ?? null,
          matingPlanned: toIsoDate(row.matingPlanned as string),
          matingActual: toIsoDate(row.matingActual as string),
          controlPlanned: toIsoDate(row.controlPlanned as string),
          controlActual: toIsoDate(row.controlActual as string),
          birthPlanned: toIsoDate(row.birthPlanned as string),
          birthActual: toIsoDate(row.birthActual as string),
          kitCount: row.kitCount || null,
        })
        created++
      }
    }

    return Response.json({ created, updated })
  } catch (e) {
    console.error('Import confirm error:', e)
    return Response.json({ detail: `Ошибка импорта: ${e}` }, { status: 500 })
  }
}
