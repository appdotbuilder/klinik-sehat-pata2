import { type User } from '../schema';

export async function getUsers(): Promise<User[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all users for admin management
    // This should only be accessible by admin role
    // Steps to implement:
    // 1. Verify user has admin role (from auth context)
    // 2. Query all users from database
    // 3. Return users without password hashes for security
    
    return [];
}