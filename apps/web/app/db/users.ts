
import { usersTable } from './schema/schema';
import { v7 as uuidv7 } from 'uuid';
import { drizzle } from 'drizzle-orm/libsql';


/**
 * Creates a new user in the database.
 * @param name - The name of the user
 * @returns The created user row
 */
export async function createUser(name: string) {
    const db = drizzle({
        connection: {
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN!
        }
    });
    // Generate UUID v7 and use as 16-byte buffer
    const userId = uuidv7();
    const [createdUser] = await db
        .insert(usersTable)
        .values({
            id: userId,
            name,
        })
        .returning();
    return createdUser;
}

