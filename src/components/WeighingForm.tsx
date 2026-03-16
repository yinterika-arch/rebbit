'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Litter, Weighing } from '@/lib/types'

interface Props {
  initial?: { litter: Litter; num: 1 | 2 }
  onSave: (w: Weighing) => void
  onCancel: () => void
}

export default function WeighingForm({ initial, onSave, onCancel }: Props) {
  const [litters, setLitters] = useState<Litter[]>([])
  const [selectedLitter, setSelectedLitter] = useState<Litter | null>(initial?.litter || null)
  const [wNum, setWNum] = useState<1 | 2>(initial?.num || 1)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weights, setWeights] = useState<string[]>(
    () => Array(initial?.litter?.kit_count || 1).fill('')
  )
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getLitters({ active: true }).then(setLitters).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedLitter && selectedLitter.kit_count) {
      setWeights(Array(selectedLitter.kit_count).fill(''))
    }
  }, [selectedLitter?.id])

  const validWeights = weights.map(w => parseFloat(w)).filter(w => !isNaN(w) && w > 0)
  const count = validWeights.length
  const avg = count ? (validWeights.reduce((a, b) => a + b, 0) / count).toFixed(3) : null
  const total = count ? validWeights.reduce((a, b) => a + b, 0).toFixed(3) : null

  // Compare with weighing 1 for weighing 2
  const w1 = selectedLitter?.weighing_1
  const defective = wNum === 2 && w1 && count > 0 ? (w1.kit_count || 0) - count : null

  function addSlot() { setWeights(w => [...w, '']) }
  function removeSlot(i: number) { setWeights(w => w.filter((_, idx) => idx !== i)) }
  function setWeight(i: number, val: string) {
    setWeights(w => { const n = [...w]; n[i] = val; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLitter) { setError('Выберите окрол'); return }
    if (count === 0) { setError('Введите хотя бы один вес'); return }
    setLoading(true)
    setError('')
    try {
      const result = await api.createWeighing({
        litter_id: selectedLitter.id,
        weighing_number: wNum,
        weighing_date: date,
        weights: validWeights,
        notes: notes || undefined,
      })
      onSave(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Litter selector */}
      {!initial?.litter && (
        <div>
          <label className="label">Окрол</label>
          <select
            className="input-field"
            value={selectedLitter?.id || ''}
            onChange={e => {
              const l = litters.find(l => l.id === parseInt(e.target.value))
              setSelectedLitter(l || null)
            }}
          >
            <option value="">— Выбрать окрол —</option>
            {litters.map(l => (
              <option key={l.id} value={l.id}>
                {l.doe_nickname || '?'} — {l.birth_actual || l.birth_planned || '?'}
                {l.kit_count ? ` (${l.kit_count} кр.)` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedLitter && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-muted">
          {selectedLitter.doe_nickname} × {selectedLitter.buck_nickname || '?'}&nbsp;·&nbsp;
          Окрол: {selectedLitter.birth_actual || selectedLitter.birth_planned || '—'}&nbsp;·&nbsp;
          Крольчат: {selectedLitter.kit_count || '?'}
        </div>
      )}

      {/* Weighing type */}
      <div>
        <label className="label">Тип взвешивания</label>
        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setWNum(n)}
              className={`min-h-touch rounded-xl border text-base font-medium transition-colors
                ${wNum === n ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-border'}`}
            >
              {n === 1 ? '⚖️ Отсадка (29 дн)' : '⚖️ Приборка (100 дн)'}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="label">Дата взвешивания</label>
        <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {/* Weight inputs */}
      <div>
        <label className="label">Веса крольчат (кг)</label>
        <div className="grid grid-cols-3 gap-2">
          {weights.map((w, i) => (
            <div key={i} className="relative">
              <input
                type="number"
                step="0.001"
                min="0"
                max="10"
                className="input-field pr-8 text-center"
                value={w}
                onChange={e => setWeight(i, e.target.value)}
                placeholder={`№${i + 1}`}
              />
              {weights.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-danger text-lg w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addSlot} className="mt-2 w-full min-h-[48px] rounded-xl border-2 border-dashed border-border text-muted text-sm">
          + Добавить крольчонка
        </button>
      </div>

      {/* Summary */}
      {count > 0 && (
        <div className="bg-primary/5 rounded-xl p-4 space-y-1">
          <div className="flex justify-between text-base">
            <span className="text-muted">Количество:</span>
            <span className="font-semibold">{count}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-muted">Средний вес:</span>
            <span className="font-semibold">{avg} кг</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="text-muted">Общий вес:</span>
            <span className="font-semibold">{total} кг</span>
          </div>
          {defective !== null && (
            <div className="flex justify-between text-base pt-1 border-t border-primary/20">
              <span className="text-danger font-medium">Отсеяно:</span>
              <span className="font-bold text-danger">{Math.max(0, defective)}</span>
            </div>
          )}
        </div>
      )}

      {wNum === 2 && w1 && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm">
          <p className="font-medium text-muted mb-1">Отсадка (сравнение):</p>
          <div className="text-gray-700">
            {w1.kit_count} кр. · ср. {w1.avg_weight?.toFixed(3)} кг · итого {w1.total_weight?.toFixed(3)} кг
          </div>
        </div>
      )}

      <div>
        <label className="label">Заметки</label>
        <textarea className="input-field resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
      </div>

      {error && <div className="text-danger text-sm rounded-xl bg-red-50 px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Отмена</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}
