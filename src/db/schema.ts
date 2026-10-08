import { pgTable, uuid, text, timestamp, date, integer, index } from 'drizzle-orm/pg-core';

export const athletes = pgTable('athletes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email:text('email').notNull().unique(),
  sport:text('sport').notNull(),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
});

export const trainingSessions = pgTable('training_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  athleteId: uuid('athlete_id').notNull().references(() => athletes.id, {onDelete: 'cascade'}),
  sessionDate: date('session_date').notNull(),
  type: text('type').notNull(),
  durationMin: integer('duration_min').notNull(),
  rpe: integer('rpe').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
},
 (t) => [index('idx_sessions_athlete_date').on(t.athleteId, t.sessionDate)],
);