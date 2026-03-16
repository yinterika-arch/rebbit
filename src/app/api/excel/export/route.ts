import { NextRequest } from 'next/server'
import { db, animals, litters, weighings } from '@/lib/db'
import { getAuthUser, unauthorized } from '@/lib/auth'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  if (!await getAuthUser(req)) return unauthorized()

  const allAnimals = await db.select().from(animals)
  const allLitters = await db.select().from(litters)
  const allWeighings = await db.select().from(weighings)
  const animalMap = new Map(allAnimals.map(a => [a.id, a]))

  // Sheet 1: Племя
  const tribeData = allAnimals.map(a => ({
    'Кличка': a.nickname,
    'Дата рождения': a.dob || '',
    'Происхождение': a.origin || '',
    'Отец': a.fatherName || '',
    'Происхождение отца': a.fatherOrigin || '',
    'Мать': a.motherName || '',
    'Происхождение матери': a.motherOrigin || '',
    'Дата прихода': a.arrivedDate || '',
    'Дата списания': a.culledDate || '',
    'Пол': a.sex === 'doe' ? 'Крольчиха' : a.sex === 'buck' ? 'Кролик' : '',
    'Период отдыха (дн)': a.restPeriodDays || '',
    'Заметки': a.notes || '',
  }))

  // Sheet 2: Окролы
  const littersData = allLitters.map(l => {
    const doe = animalMap.get(l.doeId ?? -1)
    const buck = animalMap.get(l.buckId ?? -1)
    return {
      'Вязка (план)': l.matingPlanned || '',
      'Вязка (факт)': l.matingActual || '',
      'Контроль (план)': l.controlPlanned || '',
      'Контроль (факт)': l.controlActual || '',
      'Окрол (план)': l.birthPlanned || '',
      'Окрол (факт)': l.birthActual || '',
      'Крольчат': l.kitCount || '',
      'Дата отсадки': l.weaningDate || '',
      'Крольчиха': doe?.nickname || '',
      'Кролик': buck?.nickname || '',
      'Забой': l.slaughterFlag ? 'Да' : '',
      'Дата забоя': l.slaughterDate || '',
      'Заметки': l.notes || '',
    }
  })

  // Sheet 3: Взвешивания
  const w1 = allWeighings.filter(w => w.weighingNumber === 1).map(w => {
    const litter = allLitters.find(l => l.id === w.litterId)
    const doe = animalMap.get(litter?.doeId ?? -1)
    const ws: Record<string, unknown> = {
      'Крольчиха': doe?.nickname || '',
      'Дата окрола': litter?.birthActual || '',
      'Дата взвешивания': w.weighingDate || '',
    }
    const weights = (w.weights as number[]) || []
    weights.forEach((v, i) => { ws[`Вес ${i + 1}`] = v })
    ws['Количество'] = w.kitCount
    ws['Средний вес'] = w.avgWeight
    ws['Общий вес'] = w.totalWeight
    return ws
  })

  const w2 = allWeighings.filter(w => w.weighingNumber === 2).map(w => {
    const litter = allLitters.find(l => l.id === w.litterId)
    const doe = animalMap.get(litter?.doeId ?? -1)
    const ws: Record<string, unknown> = {
      'Крольчиха': doe?.nickname || '',
      'Дата окрола': litter?.birthActual || '',
      'Дата взвешивания': w.weighingDate || '',
    }
    const weights = (w.weights as number[]) || []
    weights.forEach((v, i) => { ws[`Вес ${i + 1}`] = v })
    ws['Количество'] = w.kitCount
    ws['Средний вес'] = w.avgWeight
    ws['Общий вес'] = w.totalWeight
    return ws
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tribeData), 'Племя')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(littersData), 'Окролы')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(w1), 'Взвешивание №1')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(w2), 'Взвешивание №2')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const today = new Date().toISOString().split('T')[0]

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rabbits_${today}.xlsx"`,
    },
  })
}
