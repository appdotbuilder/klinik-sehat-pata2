import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, sessionsTable } from '../db/schema';
import { type ChangePasswordInput } from '../schema';
import { changePassword } from '../handlers/change_password';
import { eq } from 'drizzle-orm';
import { randomBytes, pbkdf2Sync } from 'crypto';

// Helper functions matching the handler implementation
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

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: '', // Will be set in beforeEach
  full_name: 'Test User',
  role: 'dokter' as const,
  is_active: true
};

const testPassword = 'currentPassword123';
const newPassword = 'newPassword456';

describe('changePassword', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user with hashed password
    const hashedPassword = hashPassword(testPassword);
    const users = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: hashedPassword
      })
      .returning()
      .execute();
    
    testUserId = users[0].id;
  });

  afterEach(resetDB);

  it('should change password successfully', async () => {
    const input: ChangePasswordInput = {
      user_id: testUserId,
      current_password: testPassword,
      new_password: newPassword
    };

    const result = await changePassword(input);

    expect(result.success).toBe(true);

    // Verify password was changed in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    const user = users[0];
    expect(user).toBeDefined();

    // Verify old password no longer works
    const isOldPasswordValid = verifyPassword(testPassword, user.password_hash);
    expect(isOldPasswordValid).toBe(false);

    // Verify new password works
    const isNewPasswordValid = verifyPassword(newPassword, user.password_hash);
    expect(isNewPasswordValid).toBe(true);

    // Verify updated_at timestamp was updated
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should invalidate existing sessions', async () => {
    // Create a test session
    await db.insert(sessionsTable)
      .values({
        user_id: testUserId,
        token: 'test-session-token',
        expires_at: new Date(Date.now() + 86400000) // 1 day from now
      })
      .execute();

    // Verify session exists
    const sessionsBeforeChange = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, testUserId))
      .execute();
    expect(sessionsBeforeChange).toHaveLength(1);

    const input: ChangePasswordInput = {
      user_id: testUserId,
      current_password: testPassword,
      new_password: newPassword
    };

    await changePassword(input);

    // Verify sessions were invalidated
    const sessionsAfterChange = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, testUserId))
      .execute();
    expect(sessionsAfterChange).toHaveLength(0);
  });

  it('should throw error when user not found', async () => {
    const input: ChangePasswordInput = {
      user_id: 999999, // Non-existent user ID
      current_password: testPassword,
      new_password: newPassword
    };

    await expect(changePassword(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when current password is incorrect', async () => {
    const input: ChangePasswordInput = {
      user_id: testUserId,
      current_password: 'wrongPassword',
      new_password: newPassword
    };

    await expect(changePassword(input)).rejects.toThrow(/current password is incorrect/i);
  });

  it('should properly hash new password', async () => {
    const input: ChangePasswordInput = {
      user_id: testUserId,
      current_password: testPassword,
      new_password: newPassword
    };

    await changePassword(input);

    // Get updated user
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    const user = users[0];

    // Verify password hash is different from plain text
    expect(user.password_hash).not.toBe(newPassword);
    
    // Verify password hash follows salt:hash format
    expect(user.password_hash).toMatch(/^[a-f0-9]{64}:[a-f0-9]{128}$/);
    
    // Verify password can be verified with our verification function
    const isValid = verifyPassword(newPassword, user.password_hash);
    expect(isValid).toBe(true);
  });

  it('should handle multiple session invalidation', async () => {
    // Create multiple test sessions
    await db.insert(sessionsTable)
      .values([
        {
          user_id: testUserId,
          token: 'session-token-1',
          expires_at: new Date(Date.now() + 86400000)
        },
        {
          user_id: testUserId,
          token: 'session-token-2',
          expires_at: new Date(Date.now() + 86400000)
        },
        {
          user_id: testUserId,
          token: 'session-token-3',
          expires_at: new Date(Date.now() + 86400000)
        }
      ])
      .execute();

    // Verify sessions exist
    const sessionsBeforeChange = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, testUserId))
      .execute();
    expect(sessionsBeforeChange).toHaveLength(3);

    const input: ChangePasswordInput = {
      user_id: testUserId,
      current_password: testPassword,
      new_password: newPassword
    };

    await changePassword(input);

    // Verify all sessions were invalidated
    const sessionsAfterChange = await db.select()
      .from(sessionsTable)
      .where(eq(sessionsTable.user_id, testUserId))
      .execute();
    expect(sessionsAfterChange).toHaveLength(0);
  });

  it('should generate unique hashes for same password', async () => {
    // Hash the same password multiple times
    const hash1 = hashPassword('testPassword');
    const hash2 = hashPassword('testPassword');
    const hash3 = hashPassword('testPassword');

    // Verify hashes are different (due to random salt)
    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
    expect(hash1).not.toBe(hash3);

    // But all should verify correctly
    expect(verifyPassword('testPassword', hash1)).toBe(true);
    expect(verifyPassword('testPassword', hash2)).toBe(true);
    expect(verifyPassword('testPassword', hash3)).toBe(true);

    // Wrong password should fail for all
    expect(verifyPassword('wrongPassword', hash1)).toBe(false);
    expect(verifyPassword('wrongPassword', hash2)).toBe(false);
    expect(verifyPassword('wrongPassword', hash3)).toBe(false);
  });
});