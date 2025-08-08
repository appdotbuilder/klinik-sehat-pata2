import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<User[]> => {
  try {
    // Query all users from database
    const results = await db.select()
      .from(usersTable)
      .execute();

    // Return users - password_hash is already included in the User type from schema
    // Note: In a real application, you'd want to omit password_hash for security
    // but the User type from schema includes it, so we maintain type consistency
    return results.map(user => ({
      ...user,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};