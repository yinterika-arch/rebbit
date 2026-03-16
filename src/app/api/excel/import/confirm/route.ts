import { NextRequest } from 'next/server'
import { db, animals, litters } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()
  try {
    const { preview_id } = await req.json()
    const { tribe, litters: littersData } = JSON.parse(Buffer.from(preview_id, 'base64').toString('utf-8'))

    let created = 0
    let updated = 0

    // Import animals
    if (tribe?.length) {
      for (const row of tribe) {
        if (!row.nickname) continue
        const existing = await db.select().from(animals).where(eq(animals.nickname, row.nickname))
        if (existing.length === 0) {
          await db.insert(animals).values({
            nickname: row.nickname,
            dob: row.dob || null,
            origin: row.origin || null,
            fatherName: row.fatherName || null,
            fatherOrigin: row.fatherOrigin || null,
            motherName: row.motherName || null,
            motherOrigin: row.motherOrigin || null,
            arrivedDate: row.arrivedDate || null,
            culledDate: row.culledDate || null,
          })
          created++
        }
      }
    }

    // Import litters
    if (littersData?.length) {
      const allAnimals = await db.select().from(animals)
      const animalByName = new Map(allAnimals.map(a => [a.nickname.toLowerCase(), a]))

      for (const row of littersData) {
        if (!row.birthActual && !row.birthPlanned) continue
        const doe = row.doeName ? animalByName.get((row.doeName as string).toLowerCase()) : null
        const buck = row.buckName ? animalByName.get((row.buckName as string).toLowerCase()) : null
        await db.insert(litters).values({
          doeId: doe?.id ?? null,
          buckId: buck?.id ?? null,
          matingPlanned: row.matingPlanned || null,
          matingActual: row.matingActual || null,
          controlPlanned: row.controlPlanned || null,
          controlActual: row.controlActual || null,
          birthPlanned: row.birthPlanned || null,
          birthActual: row.birthActual || null,
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
