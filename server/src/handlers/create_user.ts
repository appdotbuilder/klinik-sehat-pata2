import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if email already exists (case-insensitive)
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email.toLowerCase()))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password using crypto.pbkdf2
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(input.password, salt, 10000, 64, 'sha512').toString('hex');
    const password_hash = `${salt}:${hash}`;

    // Insert new user into database
    const result = await db.insert(usersTable)
      .values({
        email: input.email.toLowerCase(),
        password_hash: password_hash,
        full_name: input.full_name,
        role: input.role,
        is_active: true
      })
      .returning()
      .execute();

    // Return created user data
    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};