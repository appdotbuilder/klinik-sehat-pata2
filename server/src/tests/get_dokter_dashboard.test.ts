import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getDokterDashboard } from '../handlers/get_dokter_dashboard';
import { eq } from 'drizzle-orm';

// Test user data
const testDokter: CreateUserInput = {
  email: 'doctor@test.com',
  password: 'password123',
  full_name: 'Dr. John Smith',
  role: 'dokter'
};

const testAdmin: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  full_name: 'Admin User',
  role: 'admin'
};

const testResepsionis: CreateUserInput = {
  email: 'receptionist@test.com',
  password: 'password123',
  full_name: 'Jane Receptionist',
  role: 'resepsionis'
};

describe('getDokterDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dashboard data for valid doctor', async () => {
    // Create a test doctor
    const result = await db.insert(usersTable)
      .values({
        email: testDokter.email,
        password_hash: 'hashed_password',
        full_name: testDokter.full_name,
        role: testDokter.role,
        is_active: true
      })
      .returning()
      .execute();

    const doctorId = result[0].id;

    // Get dashboard data
    const dashboard = await getDokterDashboard(doctorId);

    // Verify doctor info
    expect(dashboard.doctor_info).toBeDefined();
    expect(dashboard.doctor_info.id).toEqual(doctorId);
    expect(dashboard.doctor_info.full_name).toEqual('Dr. John Smith');
    expect(dashboard.doctor_info.email).toEqual('doctor@test.com');

    // Verify schedule structure
    expect(dashboard.today_schedule).toBeDefined();
    expect(Array.isArray(dashboard.today_schedule)).toBe(true);
    expect(dashboard.today_schedule.length).toBeGreaterThan(0);

    // Verify schedule entries structure
    dashboard.today_schedule.forEach(entry => {
      expect(entry.time).toBeDefined();
      expect(typeof entry.time).toBe('string');
      expect(entry.patient_name === null || typeof entry.patient_name === 'string').toBe(true);
    });
  });

  it('should include expected time slots in schedule', async () => {
    // Create a test doctor
    const result = await db.insert(usersTable)
      .values({
        email: testDokter.email,
        password_hash: 'hashed_password',
        full_name: testDokter.full_name,
        role: testDokter.role,
        is_active: true
      })
      .returning()
      .execute();

    const doctorId = result[0].id;

    // Get dashboard data
    const dashboard = await getDokterDashboard(doctorId);

    // Verify expected time slots are present
    const expectedTimeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
    const actualTimeSlots = dashboard.today_schedule.map(entry => entry.time);
    
    expectedTimeSlots.forEach(time => {
      expect(actualTimeSlots).toContain(time);
    });
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentId = 999;
    
    await expect(getDokterDashboard(nonExistentId)).rejects.toThrow(/doctor not found/i);
  });

  it('should throw error for non-doctor user', async () => {
    // Create an admin user
    const result = await db.insert(usersTable)
      .values({
        email: testAdmin.email,
        password_hash: 'hashed_password',
        full_name: testAdmin.full_name,
        role: testAdmin.role,
        is_active: true
      })
      .returning()
      .execute();

    const adminId = result[0].id;

    await expect(getDokterDashboard(adminId)).rejects.toThrow(/access denied.*not a doctor/i);
  });

  it('should throw error for receptionist user', async () => {
    // Create a receptionist user
    const result = await db.insert(usersTable)
      .values({
        email: testResepsionis.email,
        password_hash: 'hashed_password',
        full_name: testResepsionis.full_name,
        role: testResepsionis.role,
        is_active: true
      })
      .returning()
      .execute();

    const receptionistId = result[0].id;

    await expect(getDokterDashboard(receptionistId)).rejects.toThrow(/access denied.*not a doctor/i);
  });

  it('should throw error for inactive doctor', async () => {
    // Create an inactive doctor
    const result = await db.insert(usersTable)
      .values({
        email: testDokter.email,
        password_hash: 'hashed_password',
        full_name: testDokter.full_name,
        role: testDokter.role,
        is_active: false // Set as inactive
      })
      .returning()
      .execute();

    const doctorId = result[0].id;

    await expect(getDokterDashboard(doctorId)).rejects.toThrow(/access denied.*account is inactive/i);
  });

  it('should return schedule with all null patient names by default', async () => {
    // Create a test doctor
    const result = await db.insert(usersTable)
      .values({
        email: testDokter.email,
        password_hash: 'hashed_password',
        full_name: testDokter.full_name,
        role: testDokter.role,
        is_active: true
      })
      .returning()
      .execute();

    const doctorId = result[0].id;

    // Get dashboard data
    const dashboard = await getDokterDashboard(doctorId);

    // All patient names should be null (no appointments scheduled)
    dashboard.today_schedule.forEach(entry => {
      expect(entry.patient_name).toBeNull();
    });
  });

  it('should handle database verification correctly', async () => {
    // Create a test doctor
    const result = await db.insert(usersTable)
      .values({
        email: testDokter.email,
        password_hash: 'hashed_password',
        full_name: testDokter.full_name,
        role: testDokter.role,
        is_active: true
      })
      .returning()
      .execute();

    const doctorId = result[0].id;

    // Get dashboard data
    const dashboard = await getDokterDashboard(doctorId);

    // Verify that the data was actually retrieved from database
    // Check that the returned doctor info matches what we inserted
    expect(dashboard.doctor_info.id).toEqual(doctorId);
    expect(dashboard.doctor_info.email).toEqual(testDokter.email);
    expect(dashboard.doctor_info.full_name).toEqual(testDokter.full_name);

    // Verify the database still contains our doctor
    const dbDoctors = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, doctorId))
      .execute();

    expect(dbDoctors).toHaveLength(1);
    expect(dbDoctors[0].role).toEqual('dokter');
    expect(dbDoctors[0].is_active).toBe(true);
  });
});