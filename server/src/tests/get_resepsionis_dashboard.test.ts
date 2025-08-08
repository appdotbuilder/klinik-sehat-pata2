import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getResepsionisData } from '../handlers/get_resepsionis_dashboard';
import { eq } from 'drizzle-orm';

// Test user data
const testReceptionist: CreateUserInput = {
  email: 'receptionist@test.com',
  password: 'password123',
  full_name: 'Test Receptionist',
  role: 'resepsionis'
};

const testDoctor: CreateUserInput = {
  email: 'doctor@test.com',
  password: 'password123',
  full_name: 'Test Doctor',
  role: 'dokter'
};

describe('getResepsionisData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return receptionist dashboard data for valid resepsionis user', async () => {
    // Create test receptionist
    const result = await db.insert(usersTable)
      .values({
        email: testReceptionist.email,
        password_hash: 'test_hash_123', // Simple test hash
        full_name: testReceptionist.full_name,
        role: testReceptionist.role,
        is_active: true
      })
      .returning()
      .execute();

    const createdUser = result[0];

    // Get dashboard data
    const dashboardData = await getResepsionisData(createdUser.id);

    // Verify receptionist info
    expect(dashboardData.receptionist_info.id).toEqual(createdUser.id);
    expect(dashboardData.receptionist_info.full_name).toEqual('Test Receptionist');
    expect(dashboardData.receptionist_info.email).toEqual('receptionist@test.com');

    // Verify appointment counts (placeholders)
    expect(dashboardData.pending_appointments).toEqual(0);
    expect(dashboardData.today_appointments).toEqual(0);
    expect(typeof dashboardData.pending_appointments).toBe('number');
    expect(typeof dashboardData.today_appointments).toBe('number');
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = 99999;

    await expect(getResepsionisData(nonExistentUserId))
      .rejects.toThrow(/receptionist not found or inactive/i);
  });

  it('should throw error for user with wrong role', async () => {
    // Create test doctor (wrong role)
    const result = await db.insert(usersTable)
      .values({
        email: testDoctor.email,
        password_hash: 'test_hash_123', // Simple test hash
        full_name: testDoctor.full_name,
        role: testDoctor.role,
        is_active: true
      })
      .returning()
      .execute();

    const createdDoctor = result[0];

    await expect(getResepsionisData(createdDoctor.id))
      .rejects.toThrow(/receptionist not found or inactive/i);
  });

  it('should throw error for inactive receptionist', async () => {
    // Create inactive receptionist
    const result = await db.insert(usersTable)
      .values({
        email: testReceptionist.email,
        password_hash: 'test_hash_123', // Simple test hash
        full_name: testReceptionist.full_name,
        role: testReceptionist.role,
        is_active: false // Set as inactive
      })
      .returning()
      .execute();

    const createdUser = result[0];

    await expect(getResepsionisData(createdUser.id))
      .rejects.toThrow(/receptionist not found or inactive/i);
  });

  it('should verify database consistency', async () => {
    // Create test receptionist
    const result = await db.insert(usersTable)
      .values({
        email: testReceptionist.email,
        password_hash: 'test_hash_123', // Simple test hash
        full_name: testReceptionist.full_name,
        role: testReceptionist.role,
        is_active: true
      })
      .returning()
      .execute();

    const createdUser = result[0];

    // Get dashboard data
    await getResepsionisData(createdUser.id);

    // Verify user still exists in database with correct data
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(dbUsers).toHaveLength(1);
    expect(dbUsers[0].role).toEqual('resepsionis');
    expect(dbUsers[0].is_active).toBe(true);
    expect(dbUsers[0].full_name).toEqual('Test Receptionist');
    expect(dbUsers[0].email).toEqual('receptionist@test.com');
  });

  it('should handle multiple receptionists correctly', async () => {
    // Create multiple receptionists
    const receptionist1 = await db.insert(usersTable)
      .values({
        email: 'receptionist1@test.com',
        password_hash: 'test_hash_123', // Simple test hash
        full_name: 'Receptionist One',
        role: 'resepsionis',
        is_active: true
      })
      .returning()
      .execute();

    const receptionist2 = await db.insert(usersTable)
      .values({
        email: 'receptionist2@test.com',
        password_hash: 'test_hash_456', // Simple test hash
        full_name: 'Receptionist Two',
        role: 'resepsionis',
        is_active: true
      })
      .returning()
      .execute();

    // Get dashboard data for each
    const dashboard1 = await getResepsionisData(receptionist1[0].id);
    const dashboard2 = await getResepsionisData(receptionist2[0].id);

    // Verify each returns correct data
    expect(dashboard1.receptionist_info.full_name).toEqual('Receptionist One');
    expect(dashboard1.receptionist_info.email).toEqual('receptionist1@test.com');
    
    expect(dashboard2.receptionist_info.full_name).toEqual('Receptionist Two');
    expect(dashboard2.receptionist_info.email).toEqual('receptionist2@test.com');

    // Verify IDs are different
    expect(dashboard1.receptionist_info.id).not.toEqual(dashboard2.receptionist_info.id);
  });
});