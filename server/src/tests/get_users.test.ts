import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

// Test user data
const testUsers = [
  {
    email: 'admin@test.com',
    password_hash: 'hashedpassword123',
    full_name: 'Test Admin',
    role: 'admin' as const,
    is_active: true
  },
  {
    email: 'doctor@test.com',
    password_hash: 'hashedpassword456',
    full_name: 'Dr. Test',
    role: 'dokter' as const,
    is_active: true
  },
  {
    email: 'receptionist@test.com',
    password_hash: 'hashedpassword789',
    full_name: 'Test Receptionist',
    role: 'resepsionis' as const,
    is_active: false
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Check that all user roles are present
    const roles = result.map(user => user.role);
    expect(roles).toContain('admin');
    expect(roles).toContain('dokter');
    expect(roles).toContain('resepsionis');
  });

  it('should return users with all required fields', async () => {
    // Create a single test user
    await db.insert(usersTable)
      .values([testUsers[0]])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Validate all fields are present
    expect(user.id).toBeDefined();
    expect(typeof user.id).toBe('number');
    expect(user.email).toBe('admin@test.com');
    expect(user.password_hash).toBe('hashedpassword123');
    expect(user.full_name).toBe('Test Admin');
    expect(user.role).toBe('admin');
    expect(user.is_active).toBe(true);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should return users with correct active status', async () => {
    // Insert users with different active statuses
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    // Find specific users by email and check their active status
    const admin = result.find(user => user.email === 'admin@test.com');
    const doctor = result.find(user => user.email === 'doctor@test.com');
    const receptionist = result.find(user => user.email === 'receptionist@test.com');

    expect(admin?.is_active).toBe(true);
    expect(doctor?.is_active).toBe(true);
    expect(receptionist?.is_active).toBe(false);
  });

  it('should return users in database insertion order', async () => {
    // Insert users one by one to test ordering
    for (const user of testUsers) {
      await db.insert(usersTable)
        .values([user])
        .execute();
    }

    const result = await getUsers();

    // Results should be in insertion order (by ID)
    expect(result).toHaveLength(3);
    expect(result[0].email).toBe('admin@test.com');
    expect(result[1].email).toBe('doctor@test.com');
    expect(result[2].email).toBe('receptionist@test.com');
  });

  it('should handle users with different roles correctly', async () => {
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    // Verify each role type is handled correctly
    const adminUser = result.find(user => user.role === 'admin');
    const doctorUser = result.find(user => user.role === 'dokter');
    const receptionistUser = result.find(user => user.role === 'resepsionis');

    expect(adminUser).toBeDefined();
    expect(adminUser?.full_name).toBe('Test Admin');
    
    expect(doctorUser).toBeDefined();
    expect(doctorUser?.full_name).toBe('Dr. Test');
    
    expect(receptionistUser).toBeDefined();
    expect(receptionistUser?.full_name).toBe('Test Receptionist');
  });

  it('should verify users are saved correctly in database', async () => {
    await db.insert(usersTable)
      .values([testUsers[0]])
      .execute();

    // Fetch through handler
    const handlerResult = await getUsers();
    
    // Fetch directly from database for comparison
    const dbResult = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, 'admin@test.com'))
      .execute();

    expect(handlerResult).toHaveLength(1);
    expect(dbResult).toHaveLength(1);
    
    // Compare handler result with direct database query
    const handlerUser = handlerResult[0];
    const dbUser = dbResult[0];
    
    expect(handlerUser.id).toBe(dbUser.id);
    expect(handlerUser.email).toBe(dbUser.email);
    expect(handlerUser.full_name).toBe(dbUser.full_name);
    expect(handlerUser.role).toBe(dbUser.role);
    expect(handlerUser.is_active).toBe(dbUser.is_active);
  });
});