'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Animal, Litter } from '@/lib/types'

interface Props {
  initial?: Litter | null
  onSave: (l: Litter) => void
  onCancel: () => void
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function LitterForm({ initial, onSave, onCancel }: Props) {
  const [does, setDoes] = useState<Animal[]>([])
  const [bucks, setBucks] = useState<Animal[]>([])
  const [form, setForm] = useState({
    doe_id: initial?.doe_id?.toString() || '',
    buck_id: initial?.buck_id?.toString() || '',
    mating_planned: initial?.mating_planned || '',
    mating_actual: initial?.mating_actual || '',
    control_planned: initial?.control_planned || '',
    control_actual: initial?.control_actual || '',
    birth_planned: initial?.birth_planned || '',
    birth_actual: initial?.birth_actual || '',
    kit_count: initial?.kit_count?.toString() || '',
    weaning_date: initial?.weaning_date || '',
    slaughter_flag: initial?.slaughter_flag || false,
    notes: initial?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAnimals({ sex: 'doe', active: false }).then(setDoes).catch(() => {})
    api.getAnimals({ sex: 'buck', active: false }).then(setBucks).catch(() => {})
  }, [])

  function set(field: string, value: string | boolean) {
    setForm(f => {
      const next = { ...f, [field]: value }
      // Auto-fill derived dates
      if (field === 'mating_actual' && typeof value === 'string') {
        if (!f.control_planned) next.control_planned = addDays(value, 5)
        if (!f.birth_planned) next.birth_planned = addDays(value, 30)
      }
      if (field === 'birth_actual' && typeof value === 'string') {
        if (!f.weaning_date) next.weaning_date = addDays(value, 29)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: Partial<Litter> = {
        doe_id: form.doe_id ? parseInt(form.doe_id) : null,
        buck_id: form.buck_id ? parseInt(form.buck_id) : null,
        mating_planned: form.mating_planned || null,
        mating_actual: form.mating_actual || null,
        control_planned: form.control_planned || null,
        control_actual: form.control_actual || null,
        birth_planned: form.birth_planned || null,
        birth_actual: form.birth_actual || null,
        kit_count: form.kit_count ? parseInt(form.kit_count) : null,
        weaning_date: form.weaning_date || null,
        slaughter_flag: form.slaughter_flag,
        notes: form.notes || null,
      }
      const result = initial
        ? await api.updateLitter(initial.id, payload)
        : await api.createLitter(payload)
      onSave(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = "input-field"
  const labelClass = "label"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass}>Крольчиха</label>
        <select className={fieldClass} value={form.doe_id} onChange={e => set('doe_id', e.target.value)}>
          <option value="">— Выбрать —</option>
          {does.map(a => <option key={a.id} value={a.id}>{a.nickname}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Кролик</label>
        <select className={fieldClass} value={form.buck_id} onChange={e => set('buck_id', e.target.value)}>
          <option value="">— Выбрать —</option>
          {bucks.map(a => <option key={a.id} value={a.id}>{a.nickname}</option>)}
        </select>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 space-y-3">
        <p className="text-sm font-medium text-muted">Вязка</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>План</label>
            <input type="date" className={fieldClass} value={form.mating_planned} onChange={e => set('mating_planned', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Факт</label>
            <input type="date" className={fieldClass} value={form.mating_actual} onChange={e => set('mating_actual', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 space-y-3">
        <p className="text-sm font-medium text-muted">Контроль</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>План (+5 дней)</label>
            <input type="date" className={fieldClass} value={form.control_planned} onChange={e => set('control_planned', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Факт</label>
            <input type="date" className={fieldClass} value={form.control_actual} onChange={e => set('control_actual', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 space-y-3">
        <p className="text-sm font-medium text-muted">Окрол</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>План (+30 дней)</label>
            <input type="date" className={fieldClass} value={form.birth_planned} onChange={e => set('birth_planned', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Факт</label>
            <input type="date" className={fieldClass} value={form.birth_actual} onChange={e => set('birth_actual', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Количество крольчат</label>
          <input type="number" className={fieldClass} value={form.kit_count} onChange={e => set('kit_count', e.target.value)} placeholder="0" min="0" max="20" />
        </div>
        <div>
          <label className={labelClass}>Отсадка (+29 дней)</label>
          <input type="date" className={fieldClass} value={form.weaning_date} onChange={e => set('weaning_date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 min-h-touch cursor-pointer">
          <input
            type="checkbox"
            className="w-6 h-6 rounded"
            checked={form.slaughter_flag}
            onChange={e => set('slaughter_flag', e.target.checked)}
          />
          <span className="text-base">Забой выполнен</span>
        </label>
      </div>

      <div>
        <label className={labelClass}>Заметки</label>
        <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="..." />
      </div>

      {error && <div className="text-danger text-sm rounded-xl bg-red-50 px-4 py-3">{error}</div>}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Отмена</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : (initial ? 'Сохранить' : 'Добавить')}
        </button>
      </div>
    </form>
  )
}
