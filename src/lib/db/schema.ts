import { pgTable, serial, varchar, text, date, timestamp, boolean, integer, numeric, time, json } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

export const animals = pgTable('animals', {
  id: serial('id').primaryKey(),
  nickname: varchar('nickname', { length: 100 }).notNull(),
  sex: varchar('sex', { length: 10 }), // 'doe' | 'buck'
  dob: date('dob'),
  origin: varchar('origin', { length: 200 }),
  fatherId: integer('father_id'),
  motherId: integer('mother_id'),
  fatherName: varchar('father_name', { length: 100 }),
  fatherOrigin: varchar('father_origin', { length: 200 }),
  motherName: varchar('mother_name', { length: 100 }),
  motherOrigin: varchar('mother_origin', { length: 200 }),
  arrivedDate: date('arrived_date'),
  culledDate: date('culled_date'),
  restPeriodDays: integer('rest_period_days'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const litters = pgTable('litters', {
  id: serial('id').primaryKey(),
  doeId: integer('doe_id'),
  buckId: integer('buck_id'),
  matingPlanned: date('mating_planned'),
  matingActual: date('mating_actual'),
  controlPlanned: date('control_planned'),
  controlActual: date('control_actual'),
  birthPlanned: date('birth_planned'),
  birthActual: date('birth_actual'),
  kitCount: integer('kit_count'),
  weaningDate: date('weaning_date'),
  slaughterFlag: boolean('slaughter_flag').default(false),
  slaughterDate: date('slaughter_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const weighings = pgTable('weighings', {
  id: serial('id').primaryKey(),
  litterId: integer('litter_id').notNull(),
  weighingNumber: integer('weighing_number').notNull(),
  weighingType: varchar('weighing_type', { length: 50 }),
  weighingDate: date('weighing_date'),
  weights: json('weights').$type<number[]>(),
  kitCount: integer('kit_count'),
  minWeight: numeric('min_weight', { precision: 6, scale: 3 }),
  maxWeight: numeric('max_weight', { precision: 6, scale: 3 }),
  avgWeight: numeric('avg_weight', { precision: 6, scale: 3 }),
  totalWeight: numeric('total_weight', { precision: 8, scale: 3 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const notificationRules = pgTable('notification_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 50 }),
  daysOffset: integer('days_offset').default(0),
  channel: varchar('channel', { length: 20 }).default('both'),
  telegramChatId: varchar('telegram_chat_id', { length: 100 }),
  emailAddress: varchar('email_address', { length: 200 }),
  sendTime: time('send_time').default('08:00:00'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const notificationLog = pgTable('notification_log', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id'),
  litterId: integer('litter_id'),
  animalId: integer('animal_id'),
  eventDate: date('event_date'),
  message: text('message'),
  channel: varchar('channel', { length: 20 }),
  status: varchar('status', { length: 20 }),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at').defaultNow(),
})
