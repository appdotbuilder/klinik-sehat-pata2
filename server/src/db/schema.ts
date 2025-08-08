import { serial, text, pgTable, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define user role enum for PostgreSQL
export const userRoleEnum = pgEnum('user_role', ['admin', 'dokter', 'resepsionis']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table for auth tokens (optional - can use JWT instead)
export const sessionsTable = pgTable('sessions', {
  id: serial('id').primaryKey(),
  user_id: serial('user_id').notNull().references(() => usersTable.id),
  token: text('token').notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect; // For SELECT operations
export type NewUser = typeof usersTable.$inferInsert; // For INSERT operations

export type Session = typeof sessionsTable.$inferSelect;
export type NewSession = typeof sessionsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable,
  sessions: sessionsTable
};