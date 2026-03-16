'use client'
import { useState } from 'react'
import type { Animal } from '@/lib/types'

interface Props {
  animal: Animal
  onEdit: (a: Animal) => void
  onDelete: (id: number) => void
}

function formatDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function AnimalCard({ animal, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const isCulled = !!animal.culled_date
  const isDoe = animal.sex === 'doe'
  const isBuck = animal.sex === 'buck'

  return (
    <div className={`card transition-all ${isCulled ? 'opacity-60' : ''}`}>
      <button
        className="w-full text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold truncate">{animal.nickname}</span>
              {isCulled && (
                <span className="badge bg-gray-100 text-gray-600">Списана</span>
              )}
              {isDoe && (
                <span className="badge bg-green-100 text-green-800">♀ Крольчиха</span>
              )}
              {isBuck && (
                <span className="badge bg-blue-100 text-blue-800">♂ Кролик</span>
              )}
              {!animal.sex && (
                <span className="badge bg-yellow-100 text-yellow-800">Пол?</span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted">
              {animal.age_str && <span>Возраст: {animal.age_str}</span>}
              {animal.litter_count > 0 && <span>Окролов: {animal.litter_count}</span>}
              {animal.last_litter_date && <span>Посл. окрол: {formatDate(animal.last_litter_date)}</span>}
            </div>

            {!animal.rest_period_days && !isCulled && (
              <div className="mt-1.5 text-sm text-warn">⚠ Не указан период отдыха</div>
            )}
          </div>
          <span className="text-muted text-xl mt-0.5">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <Row label="Дата рождения" value={formatDate(animal.dob)} />
          <Row label="Происхождение" value={animal.origin} />
          <Row label="Отец" value={animal.father_name || null} sub={animal.father_origin} />
          <Row label="Мать" value={animal.mother_name || null} sub={animal.mother_origin} />
          <Row label="Дата прихода" value={formatDate(animal.arrived_date)} />
          {animal.culled_date && <Row label="Дата списания" value={formatDate(animal.culled_date)} />}
          <Row label="Период отдыха" value={animal.rest_period_days ? `${animal.rest_period_days} дней` : null} />
          {animal.notes && <Row label="Заметки" value={animal.notes} />}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onEdit(animal)}
              className="flex-1 min-h-[48px] rounded-xl border border-primary text-primary font-medium text-base"
            >
              Изменить
            </button>
            <button
              onClick={() => { if (confirm(`Удалить ${animal.nickname}?`)) onDelete(animal.id) }}
              className="flex-1 min-h-[48px] rounded-xl border border-danger text-danger font-medium text-base"
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string | null | undefined; sub?: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm text-muted w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">
        {value || '—'}
        {sub && <span className="text-muted"> ({sub})</span>}
      </span>
    </div>
  )
}
