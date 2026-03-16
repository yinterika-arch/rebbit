export interface Animal {
  id: number
  nickname: string
  sex: 'doe' | 'buck' | null
  dob: string | null
  origin: string | null
  father_id: number | null
  mother_id: number | null
  father_name: string | null
  father_origin: string | null
  mother_name: string | null
  mother_origin: string | null
  arrived_date: string | null
  culled_date: string | null
  rest_period_days: number | null
  notes: string | null
  age_str: string | null
  litter_count: number
  last_litter_date: string | null
}

export interface Litter {
  id: number
  doe_id: number | null
  buck_id: number | null
  doe_nickname: string | null
  buck_nickname: string | null
  mating_planned: string | null
  mating_actual: string | null
  control_planned: string | null
  control_actual: string | null
  birth_planned: string | null
  birth_actual: string | null
  kit_count: number | null
  weaning_date: string | null
  slaughter_flag: boolean
  slaughter_date: string | null
  notes: string | null
  days_since_birth: number | null
  day29_date: string | null
  day100_date: string | null
  day120_date: string | null
  day29_remaining: number | null
  day100_remaining: number | null
  day120_remaining: number | null
  weighing_1: Weighing | null
  weighing_2: Weighing | null
}

export interface Weighing {
  id: number
  litter_id: number
  weighing_number: 1 | 2
  weighing_date: string | null
  weights: number[] | null
  kit_count: number | null
  avg_weight: number | null
  total_weight: number | null
  defective_count: number | null
  notes: string | null
}

export interface NotificationRule {
  id: number
  name: string
  description: string | null
  event_type: string
  days_offset: number
  channel: 'telegram' | 'email' | 'both'
  telegram_chat_id: string | null
  email_address: string | null
  send_time: string | null
  enabled: boolean
}

export interface UpcomingNotification {
  rule_id: number
  rule_name: string
  event_type: string
  litter_id: number | null
  doe_name: string | null
  event_date: string
  days_until: number
  message: string
}

export interface NotificationLog {
  id: number
  rule_id: number | null
  litter_id: number | null
  event_date: string | null
  message: string | null
  channel: string | null
  status: string | null
  error_message: string | null
  sent_at: string
}

export interface LitterStatItem {
  litter_id: number
  birth_date: string | null
  kit_count: number | null
  w1_avg: number | null
  w1_total: number | null
  w1_count: number | null
  w2_avg: number | null
  w2_total: number | null
  w2_count: number | null
  defective: number | null
}

export interface DoeStats {
  animal: Animal
  litter_count: number
  total_kits: number
  avg_kit_count: number
  total_defective: number
  avg_w1_weight: number | null
  avg_w2_weight: number | null
  litters: LitterStatItem[]
}

export interface ImportPreviewItem {
  action: 'create' | 'update' | 'skip'
  entity_type: string
  identifier: string
  changes: Record<string, { old: string; new: string }>
}

export interface ImportPreview {
  preview_id: string
  items: ImportPreviewItem[]
  summary: { create: number; update: number; skip: number }
}
