'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Animal, DoeStats } from '@/lib/types'

function formatDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function StatsPage() {
  const [does, setDoes] = useState<Animal[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [stats, setStats] = useState<DoeStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDoes, setLoadingDoes] = useState(true)

  useEffect(() => {
    api.getAnimals({ sex: 'doe', active: false })
      .then(data => {
        setDoes(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .finally(() => setLoadingDoes(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setStats(null)
    api.getDoeStats(selectedId)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId])

  if (loadingDoes) return <div className="px-4 pt-5 text-muted">Загрузка...</div>

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="page-title mb-4">Статистика</h1>

      {/* Doe selector */}
      <div className="mb-4">
        <label className="label">Крольчиха</label>
        <select
          className="input-field"
          value={selectedId || ''}
          onChange={e => setSelectedId(parseInt(e.target.value))}
        >
          {does.map(d => (
            <option key={d.id} value={d.id}>
              {d.nickname}{d.culled_date ? ' (списана)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-center py-8 text-muted">Загрузка статистики...</div>}

      {stats && (
        <>
          {/* Summary card */}
          <div className="card mb-4">
            <div className="flex items-start gap-3">
              <div>
                <h2 className="text-xl font-bold">{stats.animal.nickname}</h2>
                <p className="text-sm text-muted">{stats.animal.age_str || '—'}</p>
              </div>
              <div className="ml-auto text-right">
                {stats.animal.culled_date && (
                  <span className="badge bg-gray-100 text-gray-600">Списана</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
              <Stat label="Окролов" value={String(stats.litter_count)} />
              <Stat label="Всего крольчат" value={String(stats.total_kits)} />
              <Stat label="Среднее за окрол" value={stats.avg_kit_count ? stats.avg_kit_count.toFixed(1) : '—'} />
              <Stat label="Всего отсеяно" value={String(stats.total_defective)} />
              <Stat label="Ср. вес отсадки" value={stats.avg_w1_weight ? `${stats.avg_w1_weight.toFixed(3)} кг` : '—'} />
              <Stat label="Ср. вес приборки" value={stats.avg_w2_weight ? `${stats.avg_w2_weight.toFixed(3)} кг` : '—'} />
            </div>
          </div>

          {/* Litters table */}
          {stats.litters.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-2">История окролов</h3>
              <div className="space-y-2">
                {stats.litters.map((l, i) => (
                  <div key={l.litter_id} className="card">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-muted">#{i + 1}</span>
                      <span className="text-base font-medium">{formatDate(l.birth_date)}</span>
                      {l.kit_count != null && (
                        <span className="badge bg-primary/10 text-primary">{l.kit_count} кр.</span>
                      )}
                      {l.defective != null && l.defective > 0 && (
                        <span className="badge bg-red-100 text-danger">−{l.defective}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {l.w1_avg != null && (
                        <div className="text-sm text-muted">
                          Отсадка: <span className="text-gray-800 font-medium">{l.w1_count} кр., {l.w1_avg.toFixed(3)} кг</span>
                        </div>
                      )}
                      {l.w2_avg != null && (
                        <div className="text-sm text-muted">
                          Приборка: <span className="text-gray-800 font-medium">{l.w2_count} кр., {l.w2_avg.toFixed(3)} кг</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.litters.length === 0 && (
            <div className="text-center py-8 text-muted">Окролов пока нет</div>
          )}
        </>
      )}

      {!loading && does.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>Добавьте крольчих в разделе Племя</p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}
