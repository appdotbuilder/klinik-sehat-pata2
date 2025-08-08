import { db } from '../db';
import { usersTable } from '../db/schema';
import { type DokterDashboard } from '../schema';
import { eq } from 'drizzle-orm';

export const getDokterDashboard = async (userId: number): Promise<DokterDashboard> => {
  try {
    // Get doctor information from database
    const doctors = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (doctors.length === 0) {
      throw new Error('Doctor not found');
    }

    const doctor = doctors[0];

    // Verify user has dokter role
    if (doctor.role !== 'dokter') {
      throw new Error('Access denied: User is not a doctor');
    }

    // Check if user is active
    if (!doctor.is_active) {
      throw new Error('Access denied: Doctor account is inactive');
    }

    // For now, we'll return a static schedule since we don't have appointments table
    // In a real implementation, this would query an appointments table
    const todaySchedule = [
      { time: "08:00", patient_name: null },
      { time: "09:00", patient_name: null },
      { time: "10:00", patient_name: null },
      { time: "11:00", patient_name: null },
      { time: "13:00", patient_name: null },
      { time: "14:00", patient_name: null },
      { time: "15:00", patient_name: null },
      { time: "16:00", patient_name: null }
    ];

    return {
      doctor_info: {
        id: doctor.id,
        full_name: doctor.full_name,
        email: doctor.email
      },
      today_schedule: todaySchedule
    };
  } catch (error) {
    console.error('Get doctor dashboard failed:', error);
    throw error;
  }
};