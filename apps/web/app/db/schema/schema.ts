import { sqliteTable, text, integer, blob, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const usersTable = sqliteTable('users', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  name: text('name').notNull(),
});

// Tasks table
export const tasksTable = sqliteTable('tasks', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  userId: blob('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: integer('due_at', { mode: 'number' }), // Unix timestamp
  startAt: integer('start_at', { mode: 'number' }), // Unix timestamp
  endAt: integer('end_at', { mode: 'number' }), // Unix timestamp
  completedAt: integer('completed_at', { mode: 'number' }), // Unix timestamp
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
});

// TaskTimers table
export const taskTimersTable = sqliteTable('task_timers', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  taskId: blob('task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }).$type<string>(),
  startTime: integer('start_time', { mode: 'number' }).notNull(), // Unix timestamp (seconds)
  endTime: integer('end_time', { mode: 'number' }), // Unix timestamp (seconds, optional)
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
});

// TaskComments table
export const taskCommentsTable = sqliteTable('task_comments', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  taskId: blob('task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }).$type<string>(),
  authorId: blob('author_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).$type<string>(),
  body: text('body').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
});

// Tags table (user-scoped tags)
export const tagsTable = sqliteTable('tags', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  userId: blob('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUserTag: unique().on(table.userId, table.name),
}));

// TaskTags junction table (many-to-many relationship between tasks and tags)
export const taskTagsTable = sqliteTable('task_tags', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  taskId: blob('task_id').notNull().references(() => tasksTable.id, { onDelete: 'cascade' }).$type<string>(),
  tagId: blob('tag_id').notNull().references(() => tagsTable.id, { onDelete: 'cascade' }).$type<string>(),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueTaskTag: unique().on(table.taskId, table.tagId),
}));

// OAuth Tokens table (provider-agnostic)
export const oauthTokensTable = sqliteTable('oauth_tokens', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  userId: blob('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).$type<string>(),
  providerType: text('provider_type').notNull(), // 'google' | 'outlook' | 'apple'
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: integer('expires_at', { mode: 'number' }).notNull(), // Unix timestamp
  scope: text('scope').notNull(), // Granted scopes
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUserProvider: unique().on(table.userId, table.providerType),
}));

// Calendars table (provider-agnostic)
export const calendarsTable = sqliteTable('calendars', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  userId: blob('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }).$type<string>(),
  providerType: text('provider_type').notNull(), // 'google' | 'outlook' | 'apple'
  providerCalendarId: text('provider_calendar_id').notNull(), // Provider's calendar ID
  name: text('name').notNull(), // Display name
  color: text('color'), // Calendar color
  isEnabled: integer('is_enabled', { mode: 'number' }).notNull().default(1), // Whether to sync this calendar
  lastSyncedAt: integer('last_synced_at', { mode: 'number' }), // Unix timestamp
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUserProviderCalendar: unique().on(table.userId, table.providerType, table.providerCalendarId),
}));

// Calendar Events table (provider-agnostic)
export const calendarEventsTable = sqliteTable('calendar_events', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  calendarId: blob('calendar_id').notNull().references(() => calendarsTable.id, { onDelete: 'cascade' }).$type<string>(),
  providerType: text('provider_type').notNull(), // 'google' | 'outlook' | 'apple' (denormalized for queries)
  providerEventId: text('provider_event_id').notNull(), // Provider's event ID
  title: text('title').notNull(),
  description: text('description'),
  startAt: integer('start_at', { mode: 'number' }).notNull(), // Unix timestamp
  endAt: integer('end_at', { mode: 'number' }).notNull(), // Unix timestamp
  isAllDay: integer('is_all_day', { mode: 'number' }).notNull().default(0),
  location: text('location'),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueCalendarEvent: unique().on(table.calendarId, table.providerEventId),
}));

// Calendar Watch Channels table (for push notifications)
export const calendarWatchChannelsTable = sqliteTable('calendar_watch_channels', {
  id: blob('id').primaryKey().$type<string>(), // UUID v7 (16 bytes)
  calendarId: blob('calendar_id').notNull().references(() => calendarsTable.id, { onDelete: 'cascade' }).$type<string>(),
  channelId: text('channel_id').notNull(), // UUID sent to Google for identifying the channel
  resourceId: text('resource_id').notNull(), // Resource ID returned by Google
  providerType: text('provider_type').notNull(), // 'google' | 'outlook' | 'apple'
  expiresAt: integer('expires_at', { mode: 'number' }).notNull(), // Unix timestamp when channel expires
  token: text('token'), // Optional verification token
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueCalendarChannel: unique().on(table.calendarId, table.providerType),
}));

// Indexes
export const tasksDueAtIdx = index('tasks_due_at_idx').on(tasksTable.dueAt);
export const taskTimersTaskIdIdx = index('task_timers_task_id_idx').on(taskTimersTable.taskId);
export const taskCommentsTaskIdCreatedAtIdx = index('task_comments_task_id_created_at_idx').on(taskCommentsTable.taskId, taskCommentsTable.createdAt);
export const tagsUserIdIdx = index('tags_user_id_idx').on(tagsTable.userId);
export const taskTagsTaskIdIdx = index('task_tags_task_id_idx').on(taskTagsTable.taskId);
export const taskTagsTagIdIdx = index('task_tags_tag_id_idx').on(taskTagsTable.tagId);
export const oauthTokensUserIdIdx = index('oauth_tokens_user_id_idx').on(oauthTokensTable.userId);
export const calendarsUserIdIdx = index('calendars_user_id_idx').on(calendarsTable.userId);
export const calendarEventsCalendarIdIdx = index('calendar_events_calendar_id_idx').on(calendarEventsTable.calendarId);
export const calendarEventsStartAtIdx = index('calendar_events_start_at_idx').on(calendarEventsTable.startAt);
export const calendarEventsEndAtIdx = index('calendar_events_end_at_idx').on(calendarEventsTable.endAt);
export const calendarWatchChannelsCalendarIdIdx = index('calendar_watch_channels_calendar_id_idx').on(calendarWatchChannelsTable.calendarId);
export const calendarWatchChannelsChannelIdIdx = index('calendar_watch_channels_channel_id_idx').on(calendarWatchChannelsTable.channelId);
export const calendarWatchChannelsExpiresAtIdx = index('calendar_watch_channels_expires_at_idx').on(calendarWatchChannelsTable.expiresAt);

// Type exports
export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertTask = typeof tasksTable.$inferInsert;
export type SelectTask = typeof tasksTable.$inferSelect;
export type InsertTaskTimer = typeof taskTimersTable.$inferInsert;
export type SelectTaskTimer = typeof taskTimersTable.$inferSelect;
export type InsertTaskComment = typeof taskCommentsTable.$inferInsert;
export type SelectTaskComment = typeof taskCommentsTable.$inferSelect;
export type InsertTag = typeof tagsTable.$inferInsert;
export type SelectTag = typeof tagsTable.$inferSelect;
export type InsertTaskTag = typeof taskTagsTable.$inferInsert;
export type SelectTaskTag = typeof taskTagsTable.$inferSelect;
export type InsertOauthToken = typeof oauthTokensTable.$inferInsert;
export type SelectOauthToken = typeof oauthTokensTable.$inferSelect;
export type InsertCalendar = typeof calendarsTable.$inferInsert;
export type SelectCalendar = typeof calendarsTable.$inferSelect;
export type InsertCalendarEvent = typeof calendarEventsTable.$inferInsert;
export type SelectCalendarEvent = typeof calendarEventsTable.$inferSelect;
export type InsertCalendarWatchChannel = typeof calendarWatchChannelsTable.$inferInsert;
export type SelectCalendarWatchChannel = typeof calendarWatchChannelsTable.$inferSelect;
