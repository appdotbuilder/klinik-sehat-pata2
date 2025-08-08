import { db } from '../db';
import { usersTable } from '../db/schema';
import { type AdminDashboard } from '../schema';
import { eq, desc, count, and } from 'drizzle-orm';

export async function getAdminDashboard(): Promise<AdminDashboard> {
  try {
    // Query total user counts by role and status
    const userStats = await db
      .select({
        role: usersTable.role,
        is_active: usersTable.is_active,
        count: count()
      })
      .from(usersTable)
      .groupBy(usersTable.role, usersTable.is_active)
      .execute();

    // Get recent user registrations (last 10)
    const recentRegistrations = await db
      .select({
        id: usersTable.id,
        full_name: usersTable.full_name,
        role: usersTable.role,
        created_at: usersTable.created_at
      })
      .from(usersTable)
      .orderBy(desc(usersTable.created_at))
      .limit(10)
      .execute();

    // Calculate statistics from grouped data
    let total_users = 0;
    let total_doctors = 0;
    let total_receptionists = 0;
    let active_users = 0;

    for (const stat of userStats) {
      const userCount = stat.count;
      
      // Count total users
      total_users += userCount;
      
      // Count active users
      if (stat.is_active) {
        active_users += userCount;
      }
      
      // Count by role
      if (stat.role === 'dokter') {
        total_doctors += userCount;
      } else if (stat.role === 'resepsionis') {
        total_receptionists += userCount;
      }
    }

    return {
      total_users,
      total_doctors,
      total_receptionists,
      active_users,
      recent_registrations: recentRegistrations
    };
  } catch (error) {
    console.error('Admin dashboard data fetch failed:', error);
    throw error;
  }
}