import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type UserRole } from '../schema';
import { login } from '../handlers/login';

const testPassword = 'test123456';

// Helper type for user data
type TestUserData = {
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

const defaultUserData: TestUserData = {
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  is_active: true
};

const createTestUser = async (userData: Partial<TestUserData> = {}, password = testPassword) => {
  const fullUserData = { ...defaultUserData, ...userData };
  const passwordHash = await Bun.password.hash(password);
  
  const result = await db.insert(usersTable)
    .values({
      ...fullUserData,
      password_hash: passwordHash
    })
    .returning()
    .execute();

  return result[0];
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    const user = await createTestUser();
    
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    const result = await login(loginInput);

    expect(result.user.id).toEqual(user.id);
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.full_name).toEqual('Test User');
    expect(result.user.role).toEqual('admin');
    expect(result.token).toContain('jwt.');
    expect(result.dashboard_redirect).toEqual('/admin/dashboard');
  });

  it('should return correct dashboard redirect for different roles', async () => {
    // Test dokter role
    await createTestUser({
      email: 'dokter@example.com',
      full_name: 'Dr. Test',
      role: 'dokter'
    });

    const dokterLogin: LoginInput = {
      email: 'dokter@example.com',
      password: testPassword
    };

    const dokterResult = await login(dokterLogin);
    expect(dokterResult.dashboard_redirect).toEqual('/dokter/dashboard');
    expect(dokterResult.user.role).toEqual('dokter');

    // Test resepsionis role
    await createTestUser({
      email: 'resepsionis@example.com',
      full_name: 'Receptionist Test',
      role: 'resepsionis'
    });

    const resepsionisLogin: LoginInput = {
      email: 'resepsionis@example.com',
      password: testPassword
    };

    const resepsionisResult = await login(resepsionisLogin);
    expect(resepsionisResult.dashboard_redirect).toEqual('/resepsionis/dashboard');
    expect(resepsionisResult.user.role).toEqual('resepsionis');
  });

  it('should throw error for non-existent email', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    expect(login(loginInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should throw error for incorrect password', async () => {
    await createTestUser();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    expect(login(loginInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should throw error for deactivated account', async () => {
    await createTestUser({
      is_active: false
    });

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    expect(login(loginInput)).rejects.toThrow(/account is deactivated/i);
  });

  it('should generate valid JWT token structure', async () => {
    await createTestUser();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    const result = await login(loginInput);

    // Verify token structure
    expect(result.token).toMatch(/^jwt\./);
    
    // Decode and verify token payload
    const tokenPart = result.token.replace('jwt.', '');
    const decoded = JSON.parse(Buffer.from(tokenPart, 'base64').toString());
    
    expect(decoded.user_id).toBeDefined();
    expect(decoded.user_role).toEqual('admin');
    expect(decoded.email).toEqual('test@example.com');
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('should handle case-sensitive email correctly', async () => {
    await createTestUser({
      email: 'Test@Example.com'
    });

    // Should fail with lowercase email if stored as mixed case
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    expect(login(loginInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should validate password hashing works correctly', async () => {
    const user = await createTestUser();

    // Verify password was actually hashed
    expect(user.password_hash).not.toEqual(testPassword);
    expect(user.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer
    
    // Verify login still works with hashed password
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: testPassword
    };

    const result = await login(loginInput);
    expect(result.user.id).toEqual(user.id);
  });
});