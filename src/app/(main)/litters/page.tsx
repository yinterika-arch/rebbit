'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Litter } from '@/lib/types'
import LitterCard from '@/components/LitterCard'
import LitterForm from '@/components/LitterForm'
import WeighingForm from '@/components/WeighingForm'
import Modal from '@/components/Modal'
import type { Weighing } from '@/lib/types'

export default function LittersPage() {
  const [litters, setLitters] = useState<Litter[]>([])
  const [activeOnly, setActiveOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [weighingModal, setWeighingModal] = useState<{ litter: Litter } | null>(null)
  const [editing, setEditing] = useState<Litter | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getLitters({ active: activeOnly })
      setLitters(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [activeOnly])

  useEffect(() => { load() }, [load])

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(l: Litter) { setEditing(l); setModalOpen(true) }

  async function handleDelete(id: number) {
    try {
      await api.deleteLitter(id)
      setLitters(prev => prev.filter(l => l.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  function handleSaveLitter(l: Litter) {
    setLitters(prev => {
      const idx = prev.findIndex(x => x.id === l.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = l; return next }
      return [l, ...prev]
    })
    setModalOpen(false)
  }

  function handleSaveWeighing(w: Weighing) {
    setWeighingModal(null)
    load() // reload to get updated weighing data
  }

  // Count urgency
  const urgent = litters.filter(l =>
    (l.day29_remaining !== null && l.day29_remaining >= 0 && l.day29_remaining <= 3) ||
    (l.day60_remaining !== null && l.day60_remaining >= 0 && l.day60_remaining <= 3) ||
    (l.day100_remaining !== null && l.day100_remaining >= 0 && l.day100_remaining <= 3) ||
    (l.day29_remaining !== null && l.day29_remaining < 0) ||
    (l.day100_remaining !== null && l.day100_remaining < 0)
  )

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Окролы</h1>
        <button onClick={openAdd} className="min-h-[48px] px-5 rounded-xl bg-primary text-white font-medium text-base">
          + Добавить
        </button>
      </div>

      {/* Urgent alert */}
      {urgent.length > 0 && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-danger">
          🔔 {urgent.length} окрол{urgent.length > 1 ? 'а' : ''} требуют внимания
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[{ v: true, l: 'Активные' }, { v: false, l: 'Все' }].map(opt => (
          <button
            key={String(opt.v)}
            onClick={() => setActiveOnly(opt.v)}
            className={`flex-1 min-h-[44px] rounded-xl text-sm font-medium border transition-colors
              ${activeOnly === opt.v ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-border'}`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted">Загрузка...</div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-danger text-sm">{error}</div>
      ) : litters.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <div className="text-5xl mb-3">🥕</div>
          <p>Окролы не найдены</p>
          <button onClick={openAdd} className="mt-4 btn-primary max-w-xs mx-auto">Добавить вязку</button>
        </div>
      ) : (
        <div className="space-y-3">
          {litters.map(l => (
            <LitterCard
              key={l.id}
              litter={l}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAddWeighing={(litter) => setWeighingModal({ litter })}
            />
          ))}
        </div>
      )}

      {/* Litter modal */}
      {modalOpen && (
        <Modal title={editing ? 'Изменить окрол' : 'Добавить вязку'} onClose={() => setModalOpen(false)}>
          <LitterForm initial={editing} onSave={handleSaveLitter} onCancel={() => setModalOpen(false)} />
        </Modal>
      )}

      {/* Weighing modal */}
      {weighingModal && (
        <Modal title="Взвешивание" onClose={() => setWeighingModal(null)}>
          <WeighingForm
            initial={weighingModal}
            onSave={handleSaveWeighing}
            onCancel={() => setWeighingModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
