import { type ResepsionisData } from '../schema';

export async function getResepsionisData(userId: number): Promise<ResepsionisData> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is providing receptionist dashboard data
    // This should only be accessible by resepsionis role
    // Steps to implement:
    // 1. Verify user has resepsionis role (from auth context)
    // 2. Get receptionist information from database
    // 3. Count pending and today's appointments
    // 4. Return receptionist dashboard data
    
    return Promise.resolve({
        receptionist_info: {
            id: userId,
            full_name: "Resepsionis Placeholder",
            email: "receptionist@placeholder.com"
        },
        pending_appointments: 5,
        today_appointments: 12
    } as ResepsionisData);
}