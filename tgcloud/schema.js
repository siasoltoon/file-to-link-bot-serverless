import { table, integer, text, index, sql } from 'sdk/db';

export const users = table('users', {
  userId: integer('user_id').primaryKey(),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const fileRecords = table('file_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerUserId: integer('owner_user_id').notNull(),
  telegramFileId: text('telegram_file_id'),
  storageKey: text('storage_key'),
  publicToken: text('public_token').unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  ownerIdx: index('idx_file_records_owner').on(t.ownerUserId),
  expiryIdx: index('idx_file_records_expiry').on(t.expiresAt),
}));

export const fileRequests = table('file_requests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  requestType: text('request_type').notNull(),
  status: text('status').notNull().default('received'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  userIdx: index('idx_file_requests_user').on(t.userId),
}));
