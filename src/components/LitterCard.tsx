'use client'
import { useState } from 'react'
import type { Litter } from '@/lib/types'

interface Props {
  litter: Litter
  onEdit: (l: Litter) => void
  onDelete: (id: number) => void
  onAddWeighing: (l: Litter) => void
}

function formatDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s + 'T00:00:00')
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function CountdownBadge({ days, label }: { days: number | null; label: string }) {
  if (days === null) return null
  const color = days < 0
    ? 'bg-red-100 text-red-800'
    : days <= 7
    ? 'bg-yellow-100 text-yellow-800'
    : 'bg-green-100 text-green-800'
  const text = days < 0 ? `${label}: просрочено на ${Math.abs(days)} д.` : days === 0 ? `${label}: сегодня!` : `${label}: через ${days} д.`
  return <span className={`badge ${color}`}>{text}</span>
}

export default function LitterCard({ litter, onEdit, onDelete, onAddWeighing }: Props) {
  const [expanded, setExpanded] = useState(false)

  const birthDate = litter.birth_actual || litter.birth_planned
  const isPlanned = !litter.birth_actual && !!litter.birth_planned
  const weighings = litter.weighings || []

  return (
    <div className="card">
      <button className="w-full text-left" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold">{litter.doe_nickname || '?'}</span>
              {litter.buck_nickname && (
                <span className="text-muted text-base">× {litter.buck_nickname}</span>
              )}
              {isPlanned && <span className="badge bg-blue-100 text-blue-800">план</span>}
              {litter.slaughter_flag && <span className="badge bg-gray-200 text-gray-700">забой</span>}
            </div>

            <div className="mt-1 text-sm text-muted flex flex-wrap gap-x-3">
              <span>Окрол: {formatDate(birthDate)}</span>
              {litter.kit_count != null && <span>Крольчат: {litter.kit_count}</span>}
              {litter.days_since_birth != null && <span>{litter.days_since_birth} дней</span>}
            </div>

            {!litter.slaughter_flag && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <CountdownBadge days={litter.day29_remaining} label="29 дн" />
                <CountdownBadge days={litter.day60_remaining} label="60 дн" />
                <CountdownBadge days={litter.day100_remaining} label="100 дн" />
              </div>
            )}
          </div>
          <span className="text-muted text-xl mt-0.5">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="space-y-1.5 text-sm">
            <Row label="Вязка (план)" value={formatDate(litter.mating_planned)} />
            <Row label="Вязка (факт)" value={formatDate(litter.mating_actual)} />
            <Row label="Контроль (план)" value={formatDate(litter.control_planned)} />
            <Row label="Контроль (факт)" value={formatDate(litter.control_actual)} />
            <Row label="Окрол (план)" value={formatDate(litter.birth_planned)} />
            <Row label="Окрол (факт)" value={formatDate(litter.birth_actual)} />
            <Row label="29 дней" value={formatDate(litter.day29_date)} />
            <Row label="60 дней (отсадка)" value={formatDate(litter.day60_date)} />
            <Row label="100 дней (убой)" value={formatDate(litter.day100_date)} />
          </div>

          {weighings.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              {weighings.map(w => (
                <div key={w.id} className="text-sm">
                  <span className="font-medium">{w.weighing_type || `Взвешивание ${w.weighing_number}`}: </span>
                  {w.kit_count} кр.
                  {w.avg_weight != null && ` · ср. ${Number(w.avg_weight).toFixed(3)} кг`}
                  {w.min_weight != null && ` · мин. ${Number(w.min_weight).toFixed(3)}`}
                  {w.max_weight != null && ` · макс. ${Number(w.max_weight).toFixed(3)}`}
                  {w.weighing_date && ` (${formatDate(w.weighing_date)})`}
                </div>
              ))}
            </div>
          )}

          {!litter.slaughter_flag && (
            <button
              onClick={() => onAddWeighing(litter)}
              className="w-full min-h-[48px] rounded-xl bg-primary/10 text-primary text-sm font-medium"
            >
              + Взвешивание
            </button>
          )}

          {litter.notes && (
            <p className="text-sm text-muted">{litter.notes}</p>
          )}

          <div className="flex gap-3">
            <button onClick={() => onEdit(litter)} className="flex-1 min-h-[48px] rounded-xl border border-primary text-primary font-medium text-base">
              Изменить
            </button>
            <button onClick={() => { if (confirm('Удалить этот окрол?')) onDelete(litter.id) }} className="flex-1 min-h-[48px] rounded-xl border border-danger text-danger font-medium text-base">
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted w-40 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}
