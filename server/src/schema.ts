import { z } from 'zod';

// User role enum
export const userRoleEnum = z.enum(['admin', 'dokter', 'resepsionis']);
export type UserRole = z.infer<typeof userRoleEnum>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Auth schemas
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    full_name: z.string(),
    role: userRoleEnum
  }),
  token: z.string(),
  dashboard_redirect: z.string()
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// User management schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  full_name: z.string().min(2).optional(),
  role: userRoleEnum.optional(),
  is_active: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const changePasswordInputSchema = z.object({
  user_id: z.number(),
  current_password: z.string(),
  new_password: z.string().min(6)
});

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

// Session schema for auth context
export const sessionSchema = z.object({
  user_id: z.number(),
  user_role: userRoleEnum,
  token: z.string()
});

export type Session = z.infer<typeof sessionSchema>;

// Dashboard data schemas
export const adminDashboardSchema = z.object({
  total_users: z.number(),
  total_doctors: z.number(),
  total_receptionists: z.number(),
  active_users: z.number(),
  recent_registrations: z.array(z.object({
    id: z.number(),
    full_name: z.string(),
    role: userRoleEnum,
    created_at: z.coerce.date()
  }))
});

export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

export const dokterDashboardSchema = z.object({
  doctor_info: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string()
  }),
  today_schedule: z.array(z.object({
    time: z.string(),
    patient_name: z.string().nullable()
  }))
});

export type DokterDashboard = z.infer<typeof dokterDashboardSchema>;

export const resepsionisSchema = z.object({
  receptionist_info: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string()
  }),
  pending_appointments: z.number(),
  today_appointments: z.number()
});

export type ResepsionisData = z.infer<typeof resepsionisSchema>;