'use client'
import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import type { NotificationRule, UpcomingNotification } from '@/lib/types'
import NotificationRuleCard from '@/components/NotificationRuleCard'
import Modal from '@/components/Modal'

const EVENT_TYPES = [
  { value: 'birth_actual', label: 'От даты окрола (факт)' },
  { value: 'birth_plan', label: 'От даты окрола (план)' },
  { value: 'mating_plan', label: 'От даты вязки (план)' },
  { value: 'mating_actual', label: 'От даты вязки (факт)' },
]

const CHANNELS = [
  { value: 'both', label: '✈️ + 📧 Telegram и Email' },
  { value: 'telegram', label: '✈️ Только Telegram' },
  { value: 'email', label: '📧 Только Email' },
]

const DEFAULT_RULE: Partial<NotificationRule> = {
  name: '',
  description: '',
  event_type: 'birth_actual',
  days_offset: 0,
  channel: 'both',
  telegram_chat_id: '',
  email_address: '',
  send_time: '08:00',
  enabled: true,
}

export default function SettingsPage() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [ruleModal, setRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)
  const [ruleForm, setRuleForm] = useState<Partial<NotificationRule>>(DEFAULT_RULE)
  const [saving, setSaving] = useState(false)
  const [ruleError, setRuleError] = useState('')
  const [testResult, setTestResult] = useState('')
  const [section, setSection] = useState<'rules' | 'upcoming' | 'excel' | 'account'>('rules')
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<import('@/lib/types').ImportPreview | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')

  useEffect(() => {
    Promise.all([
      api.getNotificationRules(),
      api.getUpcomingNotifications(30),
    ]).then(([r, u]) => {
      setRules(r)
      setUpcoming(u)
    }).finally(() => setLoading(false))
  }, [])

  async function handleToggle(id: number, enabled: boolean) {
    const updated = await api.updateNotificationRule(id, { enabled })
    setRules(prev => prev.map(r => r.id === id ? updated : r))
  }

  function openAddRule() {
    setEditingRule(null)
    setRuleForm(DEFAULT_RULE)
    setRuleError('')
    setRuleModal(true)
  }

  function openEditRule(rule: NotificationRule) {
    setEditingRule(rule)
    setRuleForm({ ...rule })
    setRuleError('')
    setRuleModal(true)
  }

  async function handleDeleteRule(id: number) {
    await api.deleteNotificationRule(id)
    setRules(prev => prev.filter(r => r.id !== id))
  }

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault()
    if (!ruleForm.name?.trim()) { setRuleError('Введите название'); return }
    setSaving(true)
    setRuleError('')
    try {
      if (editingRule) {
        const updated = await api.updateNotificationRule(editingRule.id, ruleForm)
        setRules(prev => prev.map(r => r.id === editingRule.id ? updated : r))
      } else {
        const created = await api.createNotificationRule(ruleForm)
        setRules(prev => [...prev, created])
      }
      setRuleModal(false)
    } catch (e: unknown) {
      setRuleError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function handleTestNotification(channel: string) {
    setTestResult('Отправка...')
    try {
      const res = await api.sendTestNotification({ channel }) as Record<string, unknown>
      const ok = Object.entries(res).every(([, v]) => v && typeof v === 'object' && (v as Record<string,unknown>).ok)
      setTestResult(ok ? '✓ Уведомление отправлено успешно' : '✗ Ошибка отправки — проверьте настройки')
    } catch (e: unknown) {
      setTestResult(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function handleExport() {
    try {
      const blob = await api.exportExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rabbits_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка экспорта')
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const preview = await api.importExcelPreview(file)
      setImportPreview(preview)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setImportLoading(false)
    }
  }

  async function handleImportConfirm() {
    if (!importPreview) return
    setImportLoading(true)
    try {
      const result = await api.importExcelConfirm(importPreview.preview_id, importMode) as { created: number; updated: number }
      alert(`Импорт выполнен: добавлено ${result.created}, обновлено ${result.updated}`)
      setImportPreview(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setImportLoading(false)
    }
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg('')
    try {
      await api.changePassword(oldPwd, newPwd)
      setPwdMsg('Пароль изменён')
      setOldPwd(''); setNewPwd('')
    } catch (err: unknown) {
      setPwdMsg(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const SECTIONS = [
    { id: 'rules', label: '🔔 Уведомления' },
    { id: 'upcoming', label: '📅 Расписание' },
    { id: 'excel', label: '📂 Excel' },
    { id: 'account', label: '👤 Аккаунт' },
  ] as const

  function formatDate(s: string) {
    const d = new Date(s + 'T00:00:00')
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
    return `${d.getDate()} ${months[d.getMonth()]}`
  }

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="page-title mb-4">Настройки</h1>

      {/* Section tabs */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`min-h-[48px] rounded-xl text-sm font-medium border transition-colors px-2
              ${section === s.id ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-border'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Notification Rules ─────────────────────────────────────────────── */}
      {section === 'rules' && (
        <div>
          {loading ? (
            <div className="text-center py-8 text-muted">Загрузка...</div>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {rules.map(rule => (
                  <NotificationRuleCard
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggle}
                    onEdit={openEditRule}
                    onDelete={handleDeleteRule}
                  />
                ))}
              </div>
              <button onClick={openAddRule} className="btn-secondary mb-4">+ Добавить правило</button>

              {/* Test */}
              <div className="card mt-2">
                <p className="text-base font-semibold mb-3">Тестовое уведомление</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleTestNotification('telegram')} className="btn-secondary min-h-[48px]">
                    ✈️ Telegram
                  </button>
                  <button onClick={() => handleTestNotification('email')} className="btn-secondary min-h-[48px]">
                    📧 Email
                  </button>
                </div>
                {testResult && <p className="text-sm text-muted mt-2">{testResult}</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Upcoming ───────────────────────────────────────────────────────── */}
      {section === 'upcoming' && (
        <div>
          <p className="text-sm text-muted mb-3">Ближайшие 30 дней</p>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-muted">Нет запланированных уведомлений</div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((n, i) => (
                <div key={i} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-medium">{n.doe_name}</p>
                      <p className="text-sm text-muted">{n.rule_name}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{n.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-primary">{formatDate(n.event_date)}</p>
                      <p className="text-xs text-muted">
                        {n.days_until === 0 ? 'сегодня' : `через ${n.days_until} д.`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Excel ──────────────────────────────────────────────────────────── */}
      {section === 'excel' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-base font-semibold mb-2">Экспорт</p>
            <p className="text-sm text-muted mb-3">Скачать текущие данные в формате Excel</p>
            <button onClick={handleExport} className="btn-primary">📥 Скачать Excel</button>
          </div>

          <div className="card">
            <p className="text-base font-semibold mb-3">Импорт</p>

            {/* Mode selector */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {([
                { value: 'merge', label: 'Дополнить данные', desc: 'Новые записи добавятся, существующие обновятся' },
                { value: 'replace', label: 'Заменить полностью', desc: 'Все текущие данные будут удалены и заменены' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setImportMode(opt.value)}
                  className={`text-left px-4 py-3 rounded-xl border transition-colors
                    ${importMode === opt.value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-border'}`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className={`text-sm mt-0.5 ${importMode === opt.value ? 'text-white/80' : 'text-muted'}`}>{opt.desc}</div>
                </button>
              ))}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.xlsb"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-secondary"
              disabled={importLoading}
            >
              {importLoading ? 'Обработка...' : '📤 Выбрать файл'}
            </button>
          </div>

          {/* Import preview */}
          {importPreview && (
            <div className="card">
              <p className="text-base font-semibold mb-3">Предварительный просмотр изменений</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{importPreview.summary.create}</p>
                  <p className="text-xs text-muted">Добавить</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warn">{importPreview.summary.update}</p>
                  <p className="text-xs text-muted">Обновить</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted">{importPreview.summary.skip}</p>
                  <p className="text-xs text-muted">Без изменений</p>
                </div>
              </div>

              {importPreview.items.filter(i => i.action !== 'skip').slice(0, 10).map((item, i) => (
                <div key={i} className="text-sm py-1.5 border-b border-border last:border-0">
                  <span className={`badge mr-2 ${item.action === 'create' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.action === 'create' ? '+' : '~'}
                  </span>
                  <span className="text-gray-700">{item.entity_type}: </span>
                  <span className="font-medium">{item.identifier}</span>
                </div>
              ))}
              {importPreview.items.filter(i => i.action !== 'skip').length > 10 && (
                <p className="text-sm text-muted mt-2">...и ещё {importPreview.items.filter(i => i.action !== 'skip').length - 10}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => { setImportPreview(null); if (fileRef.current) fileRef.current.value = '' }} className="btn-secondary">Отмена</button>
                <button onClick={handleImportConfirm} className="btn-primary" disabled={importLoading}>
                  {importLoading ? 'Применение...' : 'Применить'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Account ────────────────────────────────────────────────────────── */}
      {section === 'account' && (
        <div className="card">
          <p className="text-base font-semibold mb-4">Изменить пароль</p>
          <form onSubmit={handleChangePwd} className="space-y-3">
            <div>
              <label className="label">Текущий пароль</label>
              <input type="password" className="input-field" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
            </div>
            <div>
              <label className="label">Новый пароль</label>
              <input type="password" className="input-field" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            {pwdMsg && <p className={`text-sm ${pwdMsg === 'Пароль изменён' ? 'text-primary' : 'text-danger'}`}>{pwdMsg}</p>}
            <button type="submit" className="btn-primary">Изменить пароль</button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={() => { localStorage.removeItem('token'); window.location.href = '/login' }}
              className="btn-danger"
            >
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* Rule modal */}
      {ruleModal && (
        <Modal title={editingRule ? 'Изменить правило' : 'Добавить правило'} onClose={() => setRuleModal(false)}>
          <form onSubmit={handleSaveRule} className="space-y-4">
            <div>
              <label className="label">Название *</label>
              <input className="input-field" value={ruleForm.name || ''} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} placeholder="Например: 29 дней — отсадка" />
            </div>

            <div>
              <label className="label">Описание</label>
              <input className="input-field" value={ruleForm.description || ''} onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <label className="label">Событие</label>
              <select className="input-field" value={ruleForm.event_type} onChange={e => setRuleForm(f => ({ ...f, event_type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Дней от события (0 = в день, -3 = за 3 дня, 29 = через 29 дней)</label>
              <input type="number" className="input-field" value={ruleForm.days_offset ?? 0} onChange={e => setRuleForm(f => ({ ...f, days_offset: parseInt(e.target.value) }))} />
            </div>

            <div>
              <label className="label">Канал</label>
              <select className="input-field" value={ruleForm.channel} onChange={e => setRuleForm(f => ({ ...f, channel: e.target.value as 'both' | 'telegram' | 'email' }))}>
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Telegram Chat ID (если нужен другой)</label>
              <input className="input-field" value={ruleForm.telegram_chat_id || ''} onChange={e => setRuleForm(f => ({ ...f, telegram_chat_id: e.target.value }))} placeholder="Оставить пустым для использования по умолчанию" />
            </div>

            <div>
              <label className="label">Email адрес (если нужен другой)</label>
              <input type="email" className="input-field" value={ruleForm.email_address || ''} onChange={e => setRuleForm(f => ({ ...f, email_address: e.target.value }))} placeholder="Оставить пустым для использования по умолчанию" />
            </div>

            <div>
              <label className="label">Время отправки</label>
              <input type="time" className="input-field" value={ruleForm.send_time || '08:00'} onChange={e => setRuleForm(f => ({ ...f, send_time: e.target.value }))} />
            </div>

            <div>
              <label className="flex items-center gap-3 min-h-touch cursor-pointer">
                <input type="checkbox" className="w-6 h-6 rounded" checked={ruleForm.enabled ?? true} onChange={e => setRuleForm(f => ({ ...f, enabled: e.target.checked }))} />
                <span className="text-base">Включено</span>
              </label>
            </div>

            {ruleError && <div className="text-danger text-sm rounded-xl bg-red-50 px-4 py-3">{ruleError}</div>}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => setRuleModal(false)} className="btn-secondary">Отмена</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
