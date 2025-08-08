import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Helper function to verify password against hash
const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Test input data for different user roles
const adminUserInput: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Admin User',
  role: 'admin'
};

const dokterUserInput: CreateUserInput = {
  email: 'doctor@test.com',
  password: 'password456',
  full_name: 'Dr. Smith',
  role: 'dokter'
};

const resepsionisUserInput: CreateUserInput = {
  email: 'receptionist@test.com',
  password: 'password789',
  full_name: 'Jane Receptionist',
  role: 'resepsionis'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an admin user successfully', async () => {
    const result = await createUser(adminUserInput);

    // Verify returned user data
    expect(result.email).toEqual('admin@test.com');
    expect(result.full_name).toEqual('Admin User');
    expect(result.role).toEqual('admin');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123');
  });

  it('should create a dokter user successfully', async () => {
    const result = await createUser(dokterUserInput);

    expect(result.email).toEqual('doctor@test.com');
    expect(result.full_name).toEqual('Dr. Smith');
    expect(result.role).toEqual('dokter');
    expect(result.is_active).toEqual(true);
  });

  it('should create a resepsionis user successfully', async () => {
    const result = await createUser(resepsionisUserInput);

    expect(result.email).toEqual('receptionist@test.com');
    expect(result.full_name).toEqual('Jane Receptionist');
    expect(result.role).toEqual('resepsionis');
    expect(result.is_active).toEqual(true);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(adminUserInput);

    // Verify password was hashed
    expect(result.password_hash).not.toEqual(adminUserInput.password);
    expect(result.password_hash.length).toBeGreaterThan(20);
    expect(result.password_hash).toContain(':'); // Should contain salt:hash format

    // Verify hash can be validated
    const isValidPassword = verifyPassword(adminUserInput.password, result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify wrong password fails
    const isWrongPassword = verifyPassword('wrongpassword', result.password_hash);
    expect(isWrongPassword).toBe(false);
  });

  it('should save user to database', async () => {
    const result = await createUser(adminUserInput);

    // Query database directly
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.email).toEqual('admin@test.com');
    expect(savedUser.full_name).toEqual('Admin User');
    expect(savedUser.role).toEqual('admin');
    expect(savedUser.is_active).toEqual(true);
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(adminUserInput);

    // Try to create another user with same email
    const duplicateUserInput = {
      ...adminUserInput,
      full_name: 'Another Admin',
      password: 'differentpassword'
    };

    await expect(createUser(duplicateUserInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should reject duplicate email with different case', async () => {
    // Create first user
    await createUser(adminUserInput);

    // Try to create user with same email in different case
    const upperCaseEmailInput = {
      ...adminUserInput,
      email: 'ADMIN@TEST.COM',
      full_name: 'Upper Case Admin'
    };

    // This should fail because emails are normalized to lowercase
    await expect(createUser(upperCaseEmailInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should create users with minimum valid data', async () => {
    const minimalInput: CreateUserInput = {
      email: 'min@test.com',
      password: '123456', // minimum 6 characters as per schema
      full_name: 'AB', // minimum 2 characters as per schema
      role: 'admin'
    };

    const result = await createUser(minimalInput);

    expect(result.email).toEqual('min@test.com');
    expect(result.full_name).toEqual('AB');
    expect(result.role).toEqual('admin');
  });

  it('should normalize email to lowercase', async () => {
    const upperCaseInput: CreateUserInput = {
      email: 'UPPER@TEST.COM',
      password: 'password123',
      full_name: 'Upper Case User',
      role: 'admin'
    };

    const result = await createUser(upperCaseInput);

    // Email should be stored in lowercase
    expect(result.email).toEqual('upper@test.com');

    // Verify it was saved correctly in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].email).toEqual('upper@test.com');
  });

  it('should handle database errors gracefully', async () => {
    // Create an input with invalid role that should cause database constraint error
    const invalidInput = {
      ...adminUserInput,
      role: 'invalid_role' as any // Invalid role should cause database enum constraint error
    };

    await expect(createUser(invalidInput))
      .rejects.toThrow();
  });
});