import { db } from '../db';
import { usersTable } from '../db/schema';
import { type Session, type UserRole } from '../schema';
import { eq } from 'drizzle-orm';

// JWT token verification with simple payload structure
// In a real application, you would use a proper JWT library like 'jsonwebtoken'
// For this implementation, we'll simulate JWT verification
interface JWTPayload {
  user_id: number;
  exp: number; // expiration timestamp
}

// Simple base64 decode simulation for JWT payload extraction
function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (middle part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed.user_id || !parsed.exp) {
      return null;
    }

    return {
      user_id: parsed.user_id,
      exp: parsed.exp
    };
  } catch (error) {
    return null;
  }
}

export async function verifyAuth(token: string): Promise<Session | null> {
  try {
    if (!token) {
      return null;
    }

    // Decode and validate JWT payload
    const payload = decodeJWTPayload(token);
    if (!payload) {
      return null;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    // Get user information from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.user_id))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return null;
    }

    return {
      user_id: user.id,
      user_role: user.role as UserRole,
      token: token
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export async function requireRole(token: string, requiredRole: UserRole): Promise<boolean> {
  try {
    const session = await verifyAuth(token);
    if (!session) {
      return false;
    }

    return session.user_role === requiredRole;
  } catch (error) {
    console.error('Role verification failed:', error);
    return false;
  }
}

// Helper function to create JWT token for testing purposes
// In a real app, this would be in a separate auth service
export function createTestToken(user_id: number, expiresInSeconds = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = { user_id, exp };
  
  // Simulate JWT structure: header.payload.signature
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'test_signature'; // In real JWT, this would be cryptographically signed
  
  return `${header}.${payloadEncoded}.${signature}`;
}