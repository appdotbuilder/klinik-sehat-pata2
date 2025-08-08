import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getAdminDashboard } from '../handlers/get_admin_dashboard';

// Test user data
const testUsers = [
  {
    email: 'admin@test.com',
    password_hash: 'hash1',
    full_name: 'Admin User',
    role: 'admin' as const,
    is_active: true
  },
  {
    email: 'doctor1@test.com',
    password_hash: 'hash2',
    full_name: 'Dr. John Smith',
    role: 'dokter' as const,
    is_active: true
  },
  {
    email: 'doctor2@test.com',
    password_hash: 'hash3',
    full_name: 'Dr. Jane Doe',
    role: 'dokter' as const,
    is_active: false
  },
  {
    email: 'receptionist1@test.com',
    password_hash: 'hash4',
    full_name: 'Reception User',
    role: 'resepsionis' as const,
    is_active: true
  },
  {
    email: 'receptionist2@test.com',
    password_hash: 'hash5',
    full_name: 'Reception User 2',
    role: 'resepsionis' as const,
    is_active: true
  }
];

describe('getAdminDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard when no users exist', async () => {
    const result = await getAdminDashboard();

    expect(result.total_users).toEqual(0);
    expect(result.total_doctors).toEqual(0);
    expect(result.total_receptionists).toEqual(0);
    expect(result.active_users).toEqual(0);
    expect(result.recent_registrations).toHaveLength(0);
  });

  it('should calculate user statistics correctly', async () => {
    // Insert test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getAdminDashboard();

    // Verify counts
    expect(result.total_users).toEqual(5);
    expect(result.total_doctors).toEqual(2);
    expect(result.total_receptionists).toEqual(2);
    expect(result.active_users).toEqual(4); // 4 active users, 1 inactive doctor
  });

  it('should return recent registrations in descending order', async () => {
    // Insert users with slight delays to ensure different timestamps
    for (let i = 0; i < testUsers.length; i++) {
      await db.insert(usersTable)
        .values([testUsers[i]])
        .execute();
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getAdminDashboard();

    expect(result.recent_registrations).toHaveLength(5);
    
    // Verify structure of recent registrations
    const firstRegistration = result.recent_registrations[0];
    expect(firstRegistration.id).toBeDefined();
    expect(firstRegistration.full_name).toBeDefined();
    expect(firstRegistration.role).toBeDefined();
    expect(firstRegistration.created_at).toBeInstanceOf(Date);

    // Verify order (most recent first)
    const timestamps = result.recent_registrations.map(reg => reg.created_at.getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i-1]).toBeGreaterThanOrEqual(timestamps[i]);
    }
  });

  it('should limit recent registrations to 10 users', async () => {
    // Create 15 users
    const manyUsers = Array.from({ length: 15 }, (_, index) => ({
      email: `user${index}@test.com`,
      password_hash: `hash${index}`,
      full_name: `User ${index}`,
      role: 'dokter' as const,
      is_active: true
    }));

    await db.insert(usersTable)
      .values(manyUsers)
      .execute();

    const result = await getAdminDashboard();

    expect(result.total_users).toEqual(15);
    expect(result.recent_registrations).toHaveLength(10);
  });

  it('should handle mixed user roles and statuses correctly', async () => {
    const mixedUsers = [
      {
        email: 'admin1@test.com',
        password_hash: 'hash1',
        full_name: 'Admin One',
        role: 'admin' as const,
        is_active: true
      },
      {
        email: 'admin2@test.com',
        password_hash: 'hash2',
        full_name: 'Admin Two',
        role: 'admin' as const,
        is_active: false
      },
      {
        email: 'doctor@test.com',
        password_hash: 'hash3',
        full_name: 'Active Doctor',
        role: 'dokter' as const,
        is_active: true
      },
      {
        email: 'receptionist@test.com',
        password_hash: 'hash4',
        full_name: 'Inactive Receptionist',
        role: 'resepsionis' as const,
        is_active: false
      }
    ];

    await db.insert(usersTable)
      .values(mixedUsers)
      .execute();

    const result = await getAdminDashboard();

    expect(result.total_users).toEqual(4);
    expect(result.total_doctors).toEqual(1);
    expect(result.total_receptionists).toEqual(1);
    expect(result.active_users).toEqual(2); // 1 admin + 1 doctor
    expect(result.recent_registrations).toHaveLength(4);
  });

  it('should include all required fields in recent registrations', async () => {
    await db.insert(usersTable)
      .values([testUsers[0]])
      .execute();

    const result = await getAdminDashboard();

    expect(result.recent_registrations).toHaveLength(1);
    
    const registration = result.recent_registrations[0];
    expect(typeof registration.id).toBe('number');
    expect(typeof registration.full_name).toBe('string');
    expect(['admin', 'dokter', 'resepsionis']).toContain(registration.role);
    expect(registration.created_at).toBeInstanceOf(Date);
    
    // Verify the actual data
    expect(registration.full_name).toEqual('Admin User');
    expect(registration.role).toEqual('admin');
  });
});