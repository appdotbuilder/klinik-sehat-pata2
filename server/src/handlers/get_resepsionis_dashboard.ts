import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ResepsionisData } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getResepsionisData = async (userId: number): Promise<ResepsionisData> => {
  try {
    // Get receptionist information from database
    const users = await db.select()
      .from(usersTable)
      .where(and(
        eq(usersTable.id, userId),
        eq(usersTable.role, 'resepsionis'),
        eq(usersTable.is_active, true)
      ))
      .execute();

    if (users.length === 0) {
      throw new Error('Receptionist not found or inactive');
    }

    const user = users[0];

    // Since there are no appointment tables in the current schema,
    // we'll return placeholder values for appointment counts
    // In a real implementation, these would query appointment tables
    const pendingAppointments = 0; // Would query appointments with status 'pending'
    const todayAppointments = 0; // Would query appointments for today's date

    return {
      receptionist_info: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      },
      pending_appointments: pendingAppointments,
      today_appointments: todayAppointments
    };
  } catch (error) {
    console.error('Failed to get receptionist dashboard data:', error);
    throw error;
  }
};