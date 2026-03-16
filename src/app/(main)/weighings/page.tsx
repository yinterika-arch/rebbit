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
  const [modal, setModal] = useState<{ litter: Litter; num: 1 | 2 } | null>(null)

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

  const needW1 = litters.filter(l => !l.weighing_1 && l.birth_actual)
  const needW2 = litters.filter(l => l.weighing_1 && !l.weighing_2 && l.birth_actual)

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="page-title mb-5">Взвешивания</h1>

      {loading ? (
        <div className="text-center py-12 text-muted">Загрузка...</div>
      ) : (
        <>
          {/* Quick add */}
          <button
            onClick={() => setModal(null as unknown as { litter: Litter; num: 1 | 2 })}
            className="btn-primary mb-5"
          >
            ⚖️ Новое взвешивание
          </button>

          {/* Weighing 1 needed */}
          {needW1.length > 0 && (
            <section className="mb-5">
              <h2 className="text-base font-semibold text-gray-700 mb-2">
                Отсадка не выполнена ({needW1.length})
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
                        onClick={() => setModal({ litter: l, num: 1 })}
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

          {/* Weighing 2 needed */}
          {needW2.length > 0 && (
            <section className="mb-5">
              <h2 className="text-base font-semibold text-gray-700 mb-2">
                Приборка не выполнена ({needW2.length})
              </h2>
              <div className="space-y-2">
                {needW2.map(l => (
                  <div key={l.id} className={`card border ${urgencyClass(l.day100_remaining)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{l.doe_nickname}</p>
                        <p className="text-sm text-muted">
                          Окрол: {formatDate(l.birth_actual)}
                          {l.weighing_1?.kit_count ? ` · Отсадка: ${l.weighing_1.kit_count} кр.` : ''}
                        </p>
                        {l.day100_remaining !== null && (
                          <p className={`text-sm font-medium mt-0.5 ${l.day100_remaining < 0 ? 'text-danger' : l.day100_remaining <= 7 ? 'text-warn' : 'text-primary'}`}>
                            100 дней: {l.day100_remaining < 0 ? `просрочено ${Math.abs(l.day100_remaining)} д.` : l.day100_remaining === 0 ? 'сегодня!' : `через ${l.day100_remaining} д.`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setModal({ litter: l, num: 2 })}
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

          {needW1.length === 0 && needW2.length === 0 && (
            <div className="text-center py-10 text-muted">
              <div className="text-4xl mb-2">✅</div>
              <p>Все взвешивания актуальны</p>
            </div>
          )}
        </>
      )}

      {/* Modal — free choice */}
      {modal === (null as unknown as { litter: Litter; num: 1 | 2 }) && (
        <Modal title="Взвешивание" onClose={() => setModal(null)}>
          <WeighingForm onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {/* Modal — pre-filled */}
      {modal && modal !== (null as unknown as { litter: Litter; num: 1 | 2 }) && (
        <Modal
          title={modal.num === 1 ? 'Отсадка — взвешивание' : 'Приборка — взвешивание'}
          onClose={() => setModal(null)}
        >
          <WeighingForm initial={modal} onSave={handleSave} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
