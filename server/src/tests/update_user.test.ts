import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';


describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test user
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password_123', // Simple hash for testing
        full_name: 'Test User',
        role: 'resepsionis',
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update user email successfully', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'newemail@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('newemail@example.com');
    expect(result.full_name).toEqual('Test User'); // Should remain unchanged
    expect(result.role).toEqual('resepsionis'); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should update user full_name successfully', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      full_name: 'Updated Name'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.full_name).toEqual('Updated Name');
    expect(result.role).toEqual('resepsionis'); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should update user role successfully', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      role: 'dokter'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.full_name).toEqual('Test User'); // Should remain unchanged
    expect(result.role).toEqual('dokter');
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should update user is_active status successfully', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.full_name).toEqual('Test User'); // Should remain unchanged
    expect(result.role).toEqual('resepsionis'); // Should remain unchanged
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'multi@example.com',
      full_name: 'Multi Update User',
      role: 'admin',
      is_active: false
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('multi@example.com');
    expect(result.full_name).toEqual('Multi Update User');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should save updated user to database', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'saved@example.com',
      full_name: 'Saved User'
    };

    await updateUser(updateInput);

    // Verify the changes were persisted in the database
    const savedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(savedUsers).toHaveLength(1);
    expect(savedUsers[0].email).toEqual('saved@example.com');
    expect(savedUsers[0].full_name).toEqual('Saved User');
    expect(savedUsers[0].role).toEqual('resepsionis'); // Should remain unchanged
    expect(savedUsers[0].is_active).toEqual(true); // Should remain unchanged
    expect(savedUsers[0].updated_at).toBeInstanceOf(Date);
    expect(savedUsers[0].updated_at > user.updated_at).toBe(true);
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999, // Non-existent ID
      email: 'nonexistent@example.com'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    const user = await createTestUser();
    const originalUpdatedAt = user.updated_at;
    
    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'timestamp@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should handle updating with same values gracefully', async () => {
    const user = await createTestUser();
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'test@example.com', // Same as original
      full_name: 'Test User', // Same as original
      role: 'resepsionis', // Same as original
      is_active: true // Same as original
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.role).toEqual('resepsionis');
    expect(result.is_active).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true); // Should still update timestamp
  });

  it('should handle partial updates correctly', async () => {
    const user = await createTestUser();
    
    // Only update email
    const emailOnlyInput: UpdateUserInput = {
      id: user.id,
      email: 'email-only@example.com'
    };

    const result = await updateUser(emailOnlyInput);

    expect(result.email).toEqual('email-only@example.com');
    expect(result.full_name).toEqual('Test User'); // Should remain unchanged
    expect(result.role).toEqual('resepsionis'); // Should remain unchanged
    expect(result.is_active).toEqual(true); // Should remain unchanged
    expect(result.password_hash).toEqual(user.password_hash); // Should remain unchanged
  });
});