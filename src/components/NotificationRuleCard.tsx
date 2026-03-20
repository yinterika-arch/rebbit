'use client'
import type { NotificationRule } from '@/lib/types'

interface Props {
  rule: NotificationRule
  onToggle: (id: number, enabled: boolean) => void
  onEdit: (rule: NotificationRule) => void
  onDelete: (id: number) => void
}

const EVENT_LABELS: Record<string, string> = {
  birth_actual: 'от даты окрола (факт)',
  birth_plan: 'от даты окрола (план)',
  mating_plan: 'от даты вязки (план)',
  mating_actual: 'от даты вязки (факт)',
  slaughter: 'от даты 120-го дня',
}

const CHANNEL_ICONS: Record<string, string> = {
  telegram: '✈️ Telegram',
  email: '📧 Email',
  both: '✈️ + 📧',
}

function formatOffset(days: number, eventType: string): string {
  const label = EVENT_LABELS[eventType] || 'от события'
  if (days === 0) return `В день события`
  if (days < 0) return `За ${Math.abs(days)} дн. до`
  return `Через ${days} дн. ${label}`
}

export default function NotificationRuleCard({ rule, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className={`card transition-all ${!rule.enabled ? 'opacity-50' : ''}`}>
      {/* Row 1: name + toggle + actions */}
      <div className="flex items-center gap-2">
        <p className="flex-1 text-base font-semibold leading-tight">{rule.name}</p>
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id, !rule.enabled)}
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0
            ${rule.enabled ? 'bg-primary' : 'bg-gray-300'}`}
          aria-label={rule.enabled ? 'Выключить' : 'Включить'}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
            ${rule.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <button
          onClick={() => onEdit(rule)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-muted"
        >✏️</button>
        <button
          onClick={() => { if (confirm(`Удалить правило "${rule.name}"?`)) onDelete(rule.id) }}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-danger/30 text-danger"
        >🗑️</button>
      </div>
      {/* Row 2: offset */}
      <p className="text-sm text-muted mt-1">
        {formatOffset(rule.days_offset, rule.event_type)}
      </p>
      {/* Row 3: description */}
      {rule.description && (
        <p className="text-sm text-gray-600 mt-0.5">{rule.description}</p>
      )}
      {/* Row 4: channel + time */}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-muted bg-gray-100 rounded-lg px-2 py-1">
          {CHANNEL_ICONS[rule.channel] || rule.channel}
        </span>
        {rule.send_time && (
          <span className="text-xs text-muted">в {rule.send_time.slice(0, 5)}</span>
        )}
      </div>
    </div>
  )
}
