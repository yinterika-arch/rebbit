'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Animal } from '@/lib/types'
import AnimalCard from '@/components/AnimalCard'
import AnimalForm from '@/components/AnimalForm'
import Modal from '@/components/Modal'

type Filter = 'doe' | 'buck' | 'all'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'doe', label: 'Крольчихи' },
  { value: 'buck', label: 'Кролики' },
  { value: 'all', label: 'Все' },
]

export default function TribePage() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [showActive, setShowActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Animal | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const sex = filter !== 'all' ? filter : undefined
      const data = await api.getAnimals({ sex, active: showActive })
      setAnimals(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [filter, showActive])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(a: Animal) { setEditing(a); setModalOpen(true) }

  async function handleDelete(id: number) {
    try {
      await api.deleteAnimal(id)
      setAnimals(prev => prev.filter(a => a.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function handleSave(a: Animal) {
    setAnimals(prev => {
      const idx = prev.findIndex(x => x.id === a.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = a; return next }
      return [a, ...prev]
    })
    setModalOpen(false)
  }

  const noRestCount = animals.filter(a => !a.culled_date && !a.rest_period_days).length

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Племя</h1>
        <button onClick={openAdd} className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-medium text-base">
          + Добавить
        </button>
      </div>

      {/* Warning */}
      {noRestCount > 0 && (
        <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-warn">
          ⚠ У {noRestCount} животных не указан период отдыха
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 min-h-[44px] rounded-xl text-sm font-medium border transition-colors
              ${filter === f.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-border'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Active toggle */}
      <button
        onClick={() => setShowActive(v => !v)}
        className={`mb-4 px-4 min-h-[40px] rounded-xl text-sm border transition-colors
          ${showActive ? 'bg-white border-border text-muted' : 'bg-gray-200 border-gray-300 text-gray-700'}`}
      >
        {showActive ? 'Показать списанных' : 'Скрыть списанных'}
      </button>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted">Загрузка...</div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-danger text-sm">{error}</div>
      ) : animals.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <div className="text-5xl mb-3">🐇</div>
          <p>Животные не найдены</p>
          <button onClick={openAdd} className="mt-4 btn-primary max-w-xs mx-auto">Добавить первое</button>
        </div>
      ) : (
        <div className="space-y-3">
          {animals.map(a => (
            <AnimalCard key={a.id} animal={a} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <Modal title={editing ? 'Изменить животное' : 'Добавить животное'} onClose={() => setModalOpen(false)}>
          <AnimalForm initial={editing} onSave={handleSave} onCancel={() => setModalOpen(false)} />
        </Modal>
      )}
    </div>
  )
}
