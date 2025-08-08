import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { eq } from 'drizzle-orm';
import { randomBytes, pbkdf2Sync } from 'crypto';

// Helper functions for password hashing
function hashPassword(password: string): string {
  const salt = randomBytes(32).toString('hex');
  const hash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

export async function changePassword(input: ChangePasswordInput): Promise<{ success: boolean }> {
  try {
    // 1. Get user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // 2. Verify current password is correct
    const isCurrentPasswordValid = verifyPassword(input.current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // 3. Hash new password
    const newPasswordHash = hashPassword(input.new_password);

    // 4. Update password in database with updated_at timestamp
    await db.update(usersTable)
      .set({
        password_hash: newPasswordHash,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, input.user_id))
      .execute();

    // 5. Invalidate existing sessions for security
    await db.delete(sessionsTable)
      .where(eq(sessionsTable.user_id, input.user_id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Password change failed:', error);
    throw error;
  }
}