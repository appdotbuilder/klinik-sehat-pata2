import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { verifyAuth, requireRole, createTestToken } from '../handlers/verify_auth';
import { type UserRole } from '../schema';

describe('verifyAuth', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let inactiveUserId: number;

  beforeEach(async () => {
    // Create test users
    const activeUser = await db.insert(usersTable)
      .values({
        email: 'active@test.com',
        password_hash: 'hashed_password',
        full_name: 'Active User',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const inactiveUser = await db.insert(usersTable)
      .values({
        email: 'inactive@test.com',
        password_hash: 'hashed_password',
        full_name: 'Inactive User',
        role: 'dokter',
        is_active: false
      })
      .returning()
      .execute();

    testUserId = activeUser[0].id;
    inactiveUserId = inactiveUser[0].id;
  });

  it('should verify valid token and return session', async () => {
    const token = createTestToken(testUserId);
    const session = await verifyAuth(token);

    expect(session).toBeDefined();
    expect(session!.user_id).toEqual(testUserId);
    expect(session!.user_role).toEqual('admin');
    expect(session!.token).toEqual(token);
  });

  it('should return null for empty token', async () => {
    const session = await verifyAuth('');
    expect(session).toBeNull();
  });

  it('should return null for malformed token', async () => {
    const session = await verifyAuth('invalid.token');
    expect(session).toBeNull();
  });

  it('should return null for token with invalid base64 payload', async () => {
    const session = await verifyAuth('header.invalid_base64.signature');
    expect(session).toBeNull();
  });

  it('should return null for token with invalid JSON payload', async () => {
    const invalidPayload = Buffer.from('invalid json').toString('base64');
    const session = await verifyAuth(`header.${invalidPayload}.signature`);
    expect(session).toBeNull();
  });

  it('should return null for token missing required fields', async () => {
    const payload = Buffer.from(JSON.stringify({ user_id: 1 })).toString('base64'); // missing exp
    const session = await verifyAuth(`header.${payload}.signature`);
    expect(session).toBeNull();
  });

  it('should return null for expired token', async () => {
    const expiredToken = createTestToken(testUserId, -3600); // expired 1 hour ago
    const session = await verifyAuth(expiredToken);
    expect(session).toBeNull();
  });

  it('should return null for token with non-existent user', async () => {
    const token = createTestToken(99999); // non-existent user ID
    const session = await verifyAuth(token);
    expect(session).toBeNull();
  });

  it('should return null for inactive user token', async () => {
    const token = createTestToken(inactiveUserId);
    const session = await verifyAuth(token);
    expect(session).toBeNull();
  });

  it('should handle different user roles correctly', async () => {
    // Create dokter user
    const dokterUser = await db.insert(usersTable)
      .values({
        email: 'dokter@test.com',
        password_hash: 'hashed_password',
        full_name: 'Dr. Test',
        role: 'dokter',
        is_active: true
      })
      .returning()
      .execute();

    const token = createTestToken(dokterUser[0].id);
    const session = await verifyAuth(token);

    expect(session).toBeDefined();
    expect(session!.user_role).toEqual('dokter');
  });
});

describe('requireRole', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let adminUserId: number;
  let dokterUserId: number;
  let resepsionisUserId: number;

  beforeEach(async () => {
    // Create users with different roles
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@test.com',
        password_hash: 'hashed_password',
        full_name: 'Admin User',
        role: 'admin',
        is_active: true
      })
      .returning()
      .execute();

    const dokterUser = await db.insert(usersTable)
      .values({
        email: 'dokter@test.com',
        password_hash: 'hashed_password',
        full_name: 'Dokter User',
        role: 'dokter',
        is_active: true
      })
      .returning()
      .execute();

    const resepsionisUser = await db.insert(usersTable)
      .values({
        email: 'resepsionis@test.com',
        password_hash: 'hashed_password',
        full_name: 'Resepsionis User',
        role: 'resepsionis',
        is_active: true
      })
      .returning()
      .execute();

    adminUserId = adminUser[0].id;
    dokterUserId = dokterUser[0].id;
    resepsionisUserId = resepsionisUser[0].id;
  });

  it('should return true when user role matches required role', async () => {
    const adminToken = createTestToken(adminUserId);
    const result = await requireRole(adminToken, 'admin');
    expect(result).toBe(true);
  });

  it('should return false when user role does not match required role', async () => {
    const dokterToken = createTestToken(dokterUserId);
    const result = await requireRole(dokterToken, 'admin');
    expect(result).toBe(false);
  });

  it('should return false for invalid token', async () => {
    const result = await requireRole('invalid_token', 'admin');
    expect(result).toBe(false);
  });

  it('should return false for empty token', async () => {
    const result = await requireRole('', 'admin');
    expect(result).toBe(false);
  });

  it('should verify all role types correctly', async () => {
    const adminToken = createTestToken(adminUserId);
    const dokterToken = createTestToken(dokterUserId);
    const resepsionisToken = createTestToken(resepsionisUserId);

    // Test admin role
    expect(await requireRole(adminToken, 'admin')).toBe(true);
    expect(await requireRole(adminToken, 'dokter')).toBe(false);
    expect(await requireRole(adminToken, 'resepsionis')).toBe(false);

    // Test dokter role
    expect(await requireRole(dokterToken, 'admin')).toBe(false);
    expect(await requireRole(dokterToken, 'dokter')).toBe(true);
    expect(await requireRole(dokterToken, 'resepsionis')).toBe(false);

    // Test resepsionis role
    expect(await requireRole(resepsionisToken, 'admin')).toBe(false);
    expect(await requireRole(resepsionisToken, 'dokter')).toBe(false);
    expect(await requireRole(resepsionisToken, 'resepsionis')).toBe(true);
  });

  it('should handle expired tokens', async () => {
    const expiredToken = createTestToken(adminUserId, -3600);
    const result = await requireRole(expiredToken, 'admin');
    expect(result).toBe(false);
  });

  it('should handle inactive users', async () => {
    // Create inactive user
    const inactiveUser = await db.insert(usersTable)
      .values({
        email: 'inactive@test.com',
        password_hash: 'hashed_password',
        full_name: 'Inactive User',
        role: 'admin',
        is_active: false
      })
      .returning()
      .execute();

    const token = createTestToken(inactiveUser[0].id);
    const result = await requireRole(token, 'admin');
    expect(result).toBe(false);
  });
});

describe('createTestToken', () => {
  it('should create valid JWT-like token structure', () => {
    const token = createTestToken(1, 3600);
    const parts = token.split('.');
    
    expect(parts).toHaveLength(3);
    
    // Verify payload can be decoded
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    expect(payload.user_id).toEqual(1);
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should create tokens with custom expiration', () => {
    const token = createTestToken(1, 7200); // 2 hours
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    
    const expectedExp = Math.floor(Date.now() / 1000) + 7200;
    expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - 1); // Allow 1 second tolerance
    expect(payload.exp).toBeLessThanOrEqual(expectedExp + 1);
  });
});