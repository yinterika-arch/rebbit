'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Litter, Weighing } from '@/lib/types'
import WeighingForm from '@/components/WeighingForm'
import Modal from '@/components/Modal'

function formatDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function urgencyClass(remaining: number | null) {
  if (remaining === null) return ''
  if (remaining < 0) return 'bg-red-50 border-red-200'
  if (remaining <= 7) return 'bg-yellow-50 border-yellow-200'
  return 'bg-white border-border'
}

export default function WeighingsPage() {
  const [litters, setLitters] = useState<Litter[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ litter?: Litter } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await api.getLitters({ active: true })
      setLitters(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSave(_: Weighing) {
    setModal(null)
    load()
  }

  // Litters needing weighing at 29 days (no weighing yet)
  const needW1 = litters.filter(l => l.birth_actual && l.weighings.length === 0)
  // Litters that have weighing but may need more (approaching 100 days)
  const approachingSlaughter = litters.filter(l =>
    l.birth_actual &&
    l.day100_remaining !== null &&
    l.day100_remaining >= 0 &&
    l.day100_remaining <= 14 &&
    !l.weighings.some(w => w.weighing_type === 'Убойный')
  )

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="page-title mb-5">Взвешивания</h1>

      {loading ? (
        <div className="text-center py-12 text-muted">Загрузка...</div>
      ) : (
        <>
          <button
            onClick={() => setModal({})}
            className="btn-primary mb-5"
          >
            ⚖️ Новое взвешивание
          </button>

          {/* Need first weighing */}
          {needW1.length > 0 && (
            <section className="mb-5">
              <h2 className="text-base font-semibold text-gray-700 mb-2">
                Нет взвешиваний ({needW1.length})
              </h2>
              <div className="space-y-2">
                {needW1.map(l => (
                  <div key={l.id} className={`card border ${urgencyClass(l.day29_remaining)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{l.doe_nickname}</p>
                        <p className="text-sm text-muted">
                          Окрол: {formatDate(l.birth_actual)}
                          {l.kit_count ? ` · ${l.kit_count} кр.` : ''}
                        </p>
                        {l.day29_remaining !== null && (
                          <p className={`text-sm font-medium mt-0.5 ${l.day29_remaining < 0 ? 'text-danger' : l.day29_remaining <= 7 ? 'text-warn' : 'text-primary'}`}>
                            29 дней: {l.day29_remaining < 0 ? `просрочено ${Math.abs(l.day29_remaining)} д.` : l.day29_remaining === 0 ? 'сегодня!' : `через ${l.day29_remaining} д.`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setModal({ litter: l })}
                        className="min-h-[44px] px-4 rounded-xl bg-primary text-white text-sm font-medium"
                      >
                        Взвесить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Approaching slaughter */}
          {approachingSlaughter.length > 0 && (
            <section className="mb-5">
              <h2 className="text-base font-semibold text-gray-700 mb-2">
                Скоро убой ({approachingSlaughter.length})
              </h2>
              <div className="space-y-2">
                {approachingSlaughter.map(l => (
                  <div key={l.id} className={`card border ${urgencyClass(l.day100_remaining)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{l.doe_nickname}</p>
                        <p className="text-sm text-muted">
                          Окрол: {formatDate(l.birth_actual)}
                          {l.kit_count ? ` · ${l.kit_count} кр.` : ''}
                        </p>
                        {l.day100_remaining !== null && (
                          <p className={`text-sm font-medium mt-0.5 ${l.day100_remaining < 0 ? 'text-danger' : 'text-warn'}`}>
                            100 дней: через {l.day100_remaining} д.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setModal({ litter: l })}
                        className="min-h-[44px] px-4 rounded-xl bg-secondary text-white text-sm font-medium"
                      >
                        Взвесить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {needW1.length === 0 && approachingSlaughter.length === 0 && (
            <div className="text-center py-10 text-muted">
              <div className="text-4xl mb-2">✅</div>
              <p>Нет срочных взвешиваний</p>
            </div>
          )}
        </>
      )}

      {modal !== null && (
        <Modal title="Взвешивание" onClose={() => setModal(null)}>
          <WeighingForm
            initial={modal.litter ? { litter: modal.litter } : undefined}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
