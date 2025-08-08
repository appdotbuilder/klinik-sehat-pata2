import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type LoginInput, type LoginResponse } from '../schema';

export const login = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password using Bun's built-in password hashing
    const isValidPassword = await Bun.password.verify(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token using Bun's built-in JWT
    const token = await new Promise<string>((resolve, reject) => {
      const payload = {
        user_id: user.id,
        user_role: user.role,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };
      
      try {
        // Simple token generation - in production, use proper JWT library
        const tokenData = JSON.stringify(payload);
        const base64Token = Buffer.from(tokenData).toString('base64');
        resolve(`jwt.${base64Token}`);
      } catch (error) {
        reject(error);
      }
    });

    // Determine dashboard redirect based on role
    const dashboardRedirect = getDashboardRedirect(user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token,
      dashboard_redirect: dashboardRedirect
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const getDashboardRedirect = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'dokter':
      return '/dokter/dashboard';
    case 'resepsionis':
      return '/resepsionis/dashboard';
    default:
      return '/dashboard';
  }
};