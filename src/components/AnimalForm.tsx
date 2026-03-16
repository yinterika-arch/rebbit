'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Animal } from '@/lib/types'

interface Props {
  initial?: Animal | null
  onSave: (a: Animal) => void
  onCancel: () => void
}

const SEX_OPTIONS = [
  { value: 'doe', label: 'Крольчиха' },
  { value: 'buck', label: 'Кролик' },
]

export default function AnimalForm({ initial, onSave, onCancel }: Props) {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [form, setForm] = useState({
    nickname: initial?.nickname || '',
    sex: initial?.sex || '',
    dob: initial?.dob || '',
    origin: initial?.origin || '',
    father_name: initial?.father_name || '',
    father_origin: initial?.father_origin || '',
    mother_name: initial?.mother_name || '',
    mother_origin: initial?.mother_origin || '',
    arrived_date: initial?.arrived_date || '',
    culled_date: initial?.culled_date || '',
    rest_period_days: initial?.rest_period_days?.toString() || '',
    notes: initial?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAnimals({ active: false }).then(setAnimals).catch(() => {})
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nickname.trim()) { setError('Введите кличку'); return }
    setLoading(true)
    setError('')
    try {
      const payload: Partial<Animal> = {
        nickname: form.nickname.trim(),
        sex: form.sex as 'doe' | 'buck' | null || null,
        dob: form.dob || null,
        origin: form.origin || null,
        father_name: form.father_name || null,
        father_origin: form.father_origin || null,
        mother_name: form.mother_name || null,
        mother_origin: form.mother_origin || null,
        arrived_date: form.arrived_date || null,
        culled_date: form.culled_date || null,
        rest_period_days: form.rest_period_days ? parseInt(form.rest_period_days) : null,
        notes: form.notes || null,
      }
      const result = initial
        ? await api.updateAnimal(initial.id, payload)
        : await api.createAnimal(payload)
      onSave(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Кличка *</label>
        <input className="input-field" value={form.nickname} onChange={e => set('nickname', e.target.value)} placeholder="Введите кличку" />
      </div>

      <div>
        <label className="label">Пол</label>
        <div className="grid grid-cols-2 gap-3">
          {SEX_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('sex', form.sex === opt.value ? '' : opt.value)}
              className={`min-h-touch rounded-xl border text-base font-medium transition-colors
                ${form.sex === opt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-border'}`}
            >
              {opt.value === 'doe' ? '♀ ' : '♂ '}{opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Дата рождения</label>
        <input type="date" className="input-field" value={form.dob} onChange={e => set('dob', e.target.value)} />
      </div>

      <div>
        <label className="label">Происхождение</label>
        <input className="input-field" value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Откуда" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Отец (кличка)</label>
          <input className="input-field" value={form.father_name} onChange={e => set('father_name', e.target.value)} list="animals-list" placeholder="Кличка отца" />
        </div>
        <div>
          <label className="label">Мать (кличка)</label>
          <input className="input-field" value={form.mother_name} onChange={e => set('mother_name', e.target.value)} list="animals-list" placeholder="Кличка матери" />
        </div>
      </div>

      <datalist id="animals-list">
        {animals.map(a => <option key={a.id} value={a.nickname} />)}
      </datalist>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Дата прихода</label>
          <input type="date" className="input-field" value={form.arrived_date} onChange={e => set('arrived_date', e.target.value)} />
        </div>
        <div>
          <label className="label">Дата списания</label>
          <input type="date" className="input-field" value={form.culled_date} onChange={e => set('culled_date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Период отдыха (дней)</label>
        <input
          type="number"
          className="input-field"
          value={form.rest_period_days}
          onChange={e => set('rest_period_days', e.target.value)}
          placeholder="Например: 30"
          min="1" max="365"
        />
      </div>

      <div>
        <label className="label">Заметки</label>
        <textarea className="input-field resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Любые заметки..." />
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
