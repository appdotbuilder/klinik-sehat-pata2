import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateUser(input: UpdateUserInput): Promise<User> {
  try {
    // First check if user exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUsers.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Prepare update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()  // Always update the timestamp
    };

    if (input.email !== undefined) {
      updateData['email'] = input.email;
    }
    if (input.full_name !== undefined) {
      updateData['full_name'] = input.full_name;
    }
    if (input.role !== undefined) {
      updateData['role'] = input.role;
    }
    if (input.is_active !== undefined) {
      updateData['is_active'] = input.is_active;
    }

    // Update the user
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
}